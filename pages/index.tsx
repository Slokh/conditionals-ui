import {
  Button,
  Divider,
  Flex,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  StackDivider,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import { useState } from "react";
import { useSeaport } from "../context/seaport";

const Section = ({ title, buttonTitle, onClick, children }: any) => (
  <Stack>
    <Stack direction="row" align="center">
      <Text fontSize="4xl" mr={4}>
        {title}
      </Text>
      {onClick && <Button onClick={onClick}>{buttonTitle}</Button>}
    </Stack>
    {children}
  </Stack>
);

const TokenModal = ({ token }: any) => {
  const { sell } = useSeaport();

  return (
    <Flex key={token.tokenId} cursor="pointer" onClick={() => sell(token)}>
      <Image
        src={token.image}
        boxSize={32}
        alt="color"
        borderRadius={8}
        transition="all 0.2s ease"
        _hover={{ opacity: 0.4 }}
      />
    </Flex>
  );
};

const id = (hash: string) => `${hash?.substring(0, 8)}...`;

const ConditionalListingModal = ({ isOpen, onClose, parentOrder }: any) => {
  const { sellWithCondition, orders, ownedTokens } = useSeaport();
  const [conditionalType, setConditionalType] = useState("whileActive");
  const [secondOrder, setSecondOrder] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);

  const parentId = id(parentOrder?.orderHash);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Flex align="center">
            <Image
              src={parentOrder?.token?.image}
              boxSize={8}
              alt="color"
              borderRadius={8}
            />
            <Text ml={4}>{parentId}</Text>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={6}>
            <Select onChange={(e) => setConditionalType(e.target.value)}>
              <option value="whileActive">{`While ${parentId} is active`}</option>
              <option value="onceFilled">{`Once ${parentId} is fulfilled`}</option>
              <option
                value="and"
                disabled={orders?.length < 2}
              >{`Once ${parentId} AND ___ is fulfilled`}</option>
              <option
                value="or"
                disabled={orders?.length < 2}
              >{`Once ${parentId} OR ___ is fulfilled`}</option>
            </Select>
            <Stack direction="row" spacing={4}>
              {ownedTokens.map((token: any) => (
                <Flex
                  key={token.tokenId}
                  onClick={() => setSelectedToken(token)}
                >
                  <Image
                    cursor="pointer"
                    src={token.image}
                    boxSize={10}
                    borderRadius={8}
                    transform={selectedToken === token ? "rotate(-45deg)" : ""}
                    alt="color"
                    transition="all 0.2s ease"
                    _hover={{ opacity: 0.4 }}
                  />
                </Flex>
              ))}
            </Stack>
            {["and", "or"].includes(conditionalType) && (
              <Select
                onChange={(e) =>
                  setSecondOrder(
                    orders.find(
                      ({ orderHash }) => orderHash === e.currentTarget.value
                    )
                  )
                }
              >
                <option value="">Select another order</option>
                {orders.map((order: any) => (
                  <option
                    key={order.orderHash}
                    value={order.orderHash}
                    disabled={order.orderHash === parentOrder.orderHash}
                  >
                    {id(order.orderHash)}
                  </option>
                ))}
              </Select>
            )}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button
            onClick={() => {
              sellWithCondition(
                selectedToken,
                conditionalType,
                parentOrder,
                secondOrder
              );
              onClose();
            }}
            isDisabled={
              !selectedToken ||
              !conditionalType ||
              !parentOrder ||
              (["and", "or"].includes(conditionalType) && !secondOrder)
            }
          >
            Submit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const ListingsRow = ({ data }: any) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  // const [simulation, setSimulation] = useState();
  const { buy, simulate } = useSeaport();
  const {
    token,
    order,
    extraData,
    orderHash,
    condition,
    conditionalType,
    simulation,
  } = data;

  // const simulateBuy = async (order: any, extraData: any) => {
  //   setSimulation(await simulate(order, extraData));
  // };

  let header = "Normal";
  if (conditionalType === "whileActive") {
    header = `Condition - While ${id(condition?.orderHashes[0])} is active`;
  } else if (conditionalType === "onceFilled") {
    header = `Condition - Once ${id(condition?.orderHashes[0])} is fulfilled`;
  } else if (conditionalType === "and") {
    header = `Condition - Once ${id(condition?.orderHashes[0])} AND ${id(
      condition?.orderHashes[1]
    )} is fulfilled`;
  } else if (conditionalType === "or") {
    header = `Condition - Once ${id(condition?.orderHashes[0])} OR ${id(
      condition?.orderHashes[1]
    )} is fulfilled`;
  }

  return (
    <Stack>
      <Text fontSize="lg">{header}</Text>
      <Stack
        direction="row"
        key={token?.tokenId}
        align="center"
        divider={<StackDivider />}
        spacing={4}
      >
        <Stack align="center">
          <Flex align="center">
            <Text textAlign="center" fontSize="2xl" w={40}>
              {id(orderHash)}
            </Text>
            <Image
              src={token?.image}
              boxSize={24}
              alt="color"
              borderRadius={8}
            />
          </Flex>
        </Stack>
        <Stack align="center">
          <Flex h={8}>
            {simulation === false ? (
              <Text color="red">Listing Invalid</Text>
            ) : simulation === true ? (
              <Text color="green">Listing Valid</Text>
            ) : null}
          </Flex>
          <Stack direction="row">
            <Button onClick={() => buy(order, extraData)}>Fulfill</Button>
            {/* <Button onClick={() => simulateBuy(order, extraData)}>
              Simulate
            </Button> */}
            <Button onClick={onOpen}>Conditional Listing</Button>
          </Stack>
        </Stack>
      </Stack>
      <ConditionalListingModal
        isOpen={isOpen}
        onClose={onClose}
        parentOrder={data}
      />
    </Stack>
  );
};

const SeaportContainer = () => {
  const { mint, ownedTokens, orders, simulateAll } = useSeaport();

  return (
    <Stack spacing={32}>
      <Section title="NFTs" buttonTitle="Mint" onClick={mint}>
        <Stack direction="row">
          {ownedTokens.map((token) => (
            <TokenModal key={token.tokenId} token={token} />
          ))}
        </Stack>
      </Section>
      <Section title="Listings" buttonTitle="Simulate" onClick={simulateAll}>
        <Stack spacing={8}>
          {orders.map((order, i) => (
            <ListingsRow key={i} data={order} />
          ))}
        </Stack>
      </Section>
    </Stack>
  );
};

const Home: NextPage = () => (
  <Stack p={4} color="#000">
    <Flex justify="space-between">
      <Text>Conditional Listings by Kartik</Text>
      <ConnectButton />
    </Flex>
    <SeaportContainer />
  </Stack>
);

export default Home;
