import { Seaport } from "seaport-js";
import { ItemType } from "seaport-js/lib/constants";
import { ethers } from "ethers";
import { keccak256, parseEther } from "ethers/lib/utils";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  useAccount,
  useContract,
  useSigner,
  useWaitForTransaction,
} from "wagmi";

const NFT_CONTRACT = "0x1Bd637d9aA0Cffa60a1953Ff5eFA5663d4711DD0";
const CONDITIONAL_ZONE = "0xcdf7641f74df11b34ddd5a76de7a46bed80376a4";

const NFT_ABI = [
  "function mint(uint256 numberOfTokens) public",
  "function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256)",
  "function tokenURI(uint256 tokenId) public view returns (string)",
];

const ZONE_ABI = [
  {
    inputs: [
      { internalType: "address", name: "seaportAddress", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [{ internalType: "bytes", name: "_data", type: "bytes" }],
    name: "decodeCondition",
    outputs: [
      {
        components: [
          {
            internalType: "enum ConditionalZone.LogicGate",
            name: "logicGate",
            type: "uint8",
          },
          { internalType: "bytes32[]", name: "orderHashes", type: "bytes32[]" },
        ],
        internalType: "struct ConditionalZone.Condition",
        name: "condition",
        type: "tuple",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "enum ConditionalZone.LogicGate",
            name: "logicGate",
            type: "uint8",
          },
          { internalType: "bytes32[]", name: "orderHashes", type: "bytes32[]" },
        ],
        internalType: "struct ConditionalZone.Condition",
        name: "condition",
        type: "tuple",
      },
    ],
    name: "encodeCondition",
    outputs: [{ internalType: "bytes", name: "data", type: "bytes" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes", name: "_data", type: "bytes" }],
    name: "isConditionValid",
    outputs: [],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "orderHash", type: "bytes32" },
      { internalType: "address", name: "caller", type: "address" },
      { internalType: "address", name: "offerer", type: "address" },
      { internalType: "bytes32", name: "zoneHash", type: "bytes32" },
    ],
    name: "isValidOrder",
    outputs: [
      { internalType: "bytes4", name: "validOrderMagicValue", type: "bytes4" },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "orderHash", type: "bytes32" },
      { internalType: "address", name: "caller", type: "address" },
      {
        components: [
          {
            components: [
              { internalType: "address", name: "offerer", type: "address" },
              { internalType: "address", name: "zone", type: "address" },
              {
                components: [
                  {
                    internalType: "enum ItemType",
                    name: "itemType",
                    type: "uint8",
                  },
                  { internalType: "address", name: "token", type: "address" },
                  {
                    internalType: "uint256",
                    name: "identifierOrCriteria",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "startAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "endAmount",
                    type: "uint256",
                  },
                ],
                internalType: "struct OfferItem[]",
                name: "offer",
                type: "tuple[]",
              },
              {
                components: [
                  {
                    internalType: "enum ItemType",
                    name: "itemType",
                    type: "uint8",
                  },
                  { internalType: "address", name: "token", type: "address" },
                  {
                    internalType: "uint256",
                    name: "identifierOrCriteria",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "startAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "endAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "address payable",
                    name: "recipient",
                    type: "address",
                  },
                ],
                internalType: "struct ConsiderationItem[]",
                name: "consideration",
                type: "tuple[]",
              },
              {
                internalType: "enum OrderType",
                name: "orderType",
                type: "uint8",
              },
              { internalType: "uint256", name: "startTime", type: "uint256" },
              { internalType: "uint256", name: "endTime", type: "uint256" },
              { internalType: "bytes32", name: "zoneHash", type: "bytes32" },
              { internalType: "uint256", name: "salt", type: "uint256" },
              { internalType: "bytes32", name: "conduitKey", type: "bytes32" },
              {
                internalType: "uint256",
                name: "totalOriginalConsiderationItems",
                type: "uint256",
              },
            ],
            internalType: "struct OrderParameters",
            name: "parameters",
            type: "tuple",
          },
          { internalType: "uint120", name: "numerator", type: "uint120" },
          { internalType: "uint120", name: "denominator", type: "uint120" },
          { internalType: "bytes", name: "signature", type: "bytes" },
          { internalType: "bytes", name: "extraData", type: "bytes" },
        ],
        internalType: "struct AdvancedOrder",
        name: "order",
        type: "tuple",
      },
      {
        internalType: "bytes32[]",
        name: "priorOrderHashes",
        type: "bytes32[]",
      },
      {
        components: [
          { internalType: "uint256", name: "orderIndex", type: "uint256" },
          { internalType: "enum Side", name: "side", type: "uint8" },
          { internalType: "uint256", name: "index", type: "uint256" },
          { internalType: "uint256", name: "identifier", type: "uint256" },
          {
            internalType: "bytes32[]",
            name: "criteriaProof",
            type: "bytes32[]",
          },
        ],
        internalType: "struct CriteriaResolver[]",
        name: "criteriaResolvers",
        type: "tuple[]",
      },
    ],
    name: "isValidOrderIncludingExtraData",
    outputs: [
      { internalType: "bytes4", name: "validOrderMagicValue", type: "bytes4" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

type State = {
  mint: any;
  sell: any;
  sellWithCondition: any;
  buy: any;
  simulate: any;
  simulateAll: any;
  ownedTokens: any[];
  orders: any[];
};

type SeaportContextType = State | undefined;
type SeaportProviderProps = { children: ReactNode };

const SeaportContext = createContext<SeaportContextType>(undefined);

export const SeaportProvider = ({ children }: SeaportProviderProps) => {
  const { address } = useAccount();
  const { data: signer } = useSigner();
  const [activeTxHash, setActiveTxHash] = useState("");
  const [activeBuyTx, setActiveBuyTx] = useState<any>({});
  const [ownedTokens, setOwnedTokens] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  // @ts-ignore
  const seaport: Seaport =
    typeof window !== "undefined"
      ? new Seaport(new ethers.providers.Web3Provider(window.ethereum))
      : undefined;

  const nftContract = useContract({
    addressOrName: NFT_CONTRACT,
    contractInterface: NFT_ABI,
    signerOrProvider: signer,
  });

  const zoneContract = useContract({
    addressOrName: CONDITIONAL_ZONE,
    contractInterface: ZONE_ABI,
    signerOrProvider: signer,
  });

  const mint = async () => {
    const { hash } = await nftContract.mint(5);
    setActiveTxHash(hash);
  };

  const sellWithCondition = async (
    token: any,
    conditionalType: any,
    parentOrder: any,
    secondOrder?: any
  ) => {
    let condition;
    if (conditionalType === "whileActive") {
      condition = {
        logicGate: 3,
        orderHashes: [parentOrder.orderHash],
      };
    } else if (conditionalType === "onceFilled") {
      condition = {
        logicGate: 0,
        orderHashes: [parentOrder.orderHash],
      };
    } else if (conditionalType === "and") {
      condition = {
        logicGate: 0,
        orderHashes: [parentOrder.orderHash, secondOrder.orderHash],
      };
    } else if (conditionalType === "or") {
      condition = {
        logicGate: 1,
        orderHashes: [parentOrder.orderHash, secondOrder.orderHash],
      };
    }

    let orderData = {
      offer: [
        {
          itemType: ItemType.ERC721,
          token: NFT_CONTRACT,
          identifier: token.tokenId,
        },
      ],
      consideration: [
        {
          amount: "100000000000000",
          recipient: address,
        },
      ],
      restrictedByZone: true,
    };

    orderData.zone = CONDITIONAL_ZONE;
    const extraData = await zoneContract.encodeCondition(condition);
    orderData.zoneHash = keccak256(extraData);

    const { executeAllActions } = await seaport.createOrder(orderData, address);
    const order = await executeAllActions();

    setOrders([
      ...orders,
      {
        token,
        order,
        orderHash: await seaport.getOrderHash(order.parameters),
        condition,
        extraData,
        conditionalType,
      },
    ]);
  };

  const sell = async (token: any) => {
    const { executeAllActions } = await seaport.createOrder(
      {
        offer: [
          {
            itemType: ItemType.ERC721,
            token: NFT_CONTRACT,
            identifier: token.tokenId,
          },
        ],
        consideration: [
          {
            amount: "100000000000000",
            recipient: address,
          },
        ],
      },
      address
    );
    const order = await executeAllActions();
    setOrders([
      ...orders,
      {
        token,
        order,
        orderHash: await seaport.getOrderHash(order.parameters),
      },
    ]);
  };

  const simulate = async (order: any, extraData: any) => {
    try {
      const { actions } = await seaport.fulfillOrder({
        order,
        accountAddress: address,
        extraData,
      });
      const execute = actions[actions.length - 1];
      await execute.transactionMethods.estimateGas();
    } catch (e) {
      return false;
    }
    return true;
  };

  const simulateAll = async () => {
    let simulatedOrders = [];
    for (let i = 0; i < orders.length; i++) {
      const simulation = await simulate(orders[i].order, orders[i].extraData);
      simulatedOrders.push({
        ...orders[i],
        simulation,
      });
    }
    setOrders(simulatedOrders);
  };

  const buy = async (order: any, extraData: any) => {
    const { executeAllActions: executeAllFulfillActions } =
      await seaport.fulfillOrder({
        order,
        accountAddress: address,
        extraData,
      });

    const { hash } = await executeAllFulfillActions();
    setActiveBuyTx({ order, hash });
  };

  const refreshNFTs = async () => {
    if (!nftContract) {
      return;
    }

    let ownedTokens = [];
    for (let i = 0; ; i++) {
      try {
        const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
        const tokenUri = await nftContract.tokenURI(tokenId);
        const metadata = await JSON.parse(
          Buffer.from(
            tokenUri.replace("data:application/json;base64,", ""),
            "base64"
          ).toString("utf-8")
        );
        ownedTokens.push({
          tokenId: tokenId.toString(),
          image: metadata["image"],
        });
      } catch (e) {
        break;
      }
    }
    setOwnedTokens(ownedTokens);
  };

  useEffect(() => {
    refreshNFTs();
  }, [nftContract]); // eslint-disable-line react-hooks/exhaustive-deps

  useWaitForTransaction({
    hash: activeTxHash,
    onSuccess: refreshNFTs,
  });

  useWaitForTransaction({
    hash: activeBuyTx.hash,
    onSuccess: () =>
      setOrders(orders.filter((o) => o.order !== activeBuyTx.order)),
  });

  return (
    <SeaportContext.Provider
      value={{
        mint,
        sell,
        sellWithCondition,
        buy,
        simulate,
        simulateAll,
        ownedTokens,
        orders,
      }}
    >
      {children}
    </SeaportContext.Provider>
  );
};

export const useSeaport = () => {
  const context = useContext(SeaportContext);

  if (context === undefined) {
    throw new Error("useSeaport must be used within a SeaportProvider");
  }

  return context;
};
