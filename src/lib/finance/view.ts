export type FinanceOrderView={id:string;status:string;evidence?:"test"|"confirmed"|"unpaid"|"unverified";currency:string;paidAmount:number|null;remainingAmount:number|null;merchantAccountId:string|null;mode:"test"|"live"|null;paymentReference:string|null;reconciledAt:string|null;refundRequests:{id:string;status:string;reason:string}[];refundState:string|null;canRefund:boolean};
export type FinanceOperationView={id:string;orderId:string;status:string;providerReference:string|null;createdAt:string};
export type FinanceSnapshotView={id:string;orderId:string;status:string;createdAt:string};
export type FinancePageView={canManage?:boolean;connected?:boolean;orders:FinanceOrderView[];commands:FinanceOperationView[];snapshots:FinanceSnapshotView[];page:number;hasMore:boolean};
