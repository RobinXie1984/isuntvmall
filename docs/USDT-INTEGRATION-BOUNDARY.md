# USDT integration boundary — white-label v1

USDT is **not activated**. The storefront must not show an available USDT payment method until the merchant-specific integration and acceptance tests below pass.

An initial audit of preserved MerchantOS source verified historical TRON and Ethereum token address creation, signed transfer callbacks, internal wallet accounting and central collection. This is evidence of source capabilities, not a verified current payment service. The legacy runtime, dependencies, secrets, wallet accounts and background jobs are not part of this delivery.

## Newer collection rail verified

A separate newer wallet rail was subsequently located and inspected. Its public-address registry contains 10,000 EVM entries. Its controlled live executor supports Ethereum mainnet USDC and USDT; local historical receipts include USDT collection. Base mainnet has a USDC planning/read-only profile, not a verified Base USDT production executor. TRON USDT observation exists, but production TRON collection was not verified.

The receiver is configurable by chain and must match an explicit treasury allowlist. Source and gas-tanker signing remain local to the wallet rail. An external merchant receiver alone therefore does not establish merchant ownership of intermediate deposit wallets. Reuse the guardrails and adapter behavior; do not reuse an existing operator address pool or signing credentials for client shops.

Current inspected daemon status is shadow monitoring with movement disabled and historical execution windows closed. Explicit approved windows can override shadow, so integration must independently enforce its activation gate. No wallet service or funds were changed in this audit. No commerce adapter is activated.

## Direct merchant settlement

Each shop must use its own merchant-owned provider account or receiving wallet arrangement. The platform must not collect all merchants' funds into a shared central wallet. Do not request or store seed phrases or private signing keys in storefront configuration. Provider secrets and webhook verification secrets remain only in the individual shop's server runtime.

Before enabling USDT, document the supported chain/network, exact token contract and decimal precision, settlement asset, receiving account ownership, finality rule, fees, expiry and refund policy. A token symbol alone is not sufficient identification. Do not infer a current receiving address or provider agreement from legacy configuration.

## Required adapter behavior

- Bind provider invoices to a unique shop/order, expected amount, currency/token, destination and expiry.
- Verify callbacks using the provider's current signature and replay rules. Match the provider account and shop before using an event.
- Use durable unique event and chain/transaction/log identities so retries cannot double-credit an order.
- Confirm authoritative provider/chain state and required finality before marking an order paid or allowing fulfillment.
- Keep underpayment, overpayment, wrong asset/network, late payment, unknown confirmation and reorganization in explicit exception states.
- Link approved refunds to the original order and received payment. Enforce remaining refundable amount, destination policy, idempotent execution and confirmed result.
- Reconcile order, invoice, payment, provider fees, merchant settlement and refund references; export an auditable statement.

## Required evidence before activation

Use the supported sandbox first: valid payment, invalid callback, duplicate event, wrong account, wrong token, wrong amount, expiry, late transfer, callback retries, refund and reconciliation. Then verify a specifically authorized small real payment reaches the merchant-owned account and its refund is confirmed. Record references and redacted receipts, never credential values.

Missing provider access or settlement ownership evidence is `UNKNOWN` and keeps activation on hold. A configured wallet address, rendered QR code, successful HTTP response or simulated test is insufficient evidence of live settlement.

## Merchant handoff inputs

1. Current MerchantOS/service endpoint and supported API documentation, if a newer service exists.
2. Merchant-owned provider account, scoped sandbox/runtime credentials through the private deployment channel, and webhook setup access.
3. Supported chain/token, destination ownership, settlement asset/conversion and fee policy.
4. Underpayment, overpayment, late-payment and refund decisions plus an authorized small acceptance-test budget when ready.

## 中文说明

USDT 尚未启用。旧 MerchantOS 源码证明曾有 TRON／Ethereum 地址、回调、钱包记账及中央归集逻辑，但不能证明现行服务可用，也不能证明款项直达商家自己的账户。本交付不启用旧运行时、钱包、密钥或定时任务。

每个商城必须独立配置客户自有商户账户及服务端凭据。启用前需核实链、代币合约、收款归属、确认规则、费用、异常付款、订单退款和对账，并通过沙盒与另行授权的小额实付／退款验收。未知项保持关闭，不能用二维码、模拟支付或接口成功代替结算证据。

更新：另已核实较新的钱包服务，含一万条 EVM 地址记录及 Ethereum USDC／USDT 受控归集代码和历史记录。Base USDT 上线能力未获证明。外部收款地址已有配置／白名单机制，但中间充值地址与加油签名权仍须由客户独立控制。此模板不启用现有钱包资金操作，也不复用其他商家的地址池。

## Receiver configuration template and controlled change procedure

`config/merchant-payments.example.json` contains no receiving addresses or credentials. Ethereum USDT is marked controlled collection pilot, TRON USDT observation-only, and Base USDT unverified. Every entry is inactive. The schema deliberately accepts only `activation: "disabled"`; neither filling an address nor attesting ownership can activate checkout or collection.

The server-only loader takes an explicit serialized configuration and expected store ID. It does not discover files, read wallet-service configuration, fetch funds, set environment variables, or fall back to another shop. No current checkout handler consumes this template. Address syntax checks are preliminary only: TRON Base58Check, EVM checksum/network support, receiver ownership and settlement suitability require separate verification before any future activation.

To prepare a receiving-address change:

1. The merchant's MFA-authenticated Super Admin selects the correct shop and reviews a proposed private runtime file. Admin, Operator, CSR and other staff cannot authorize this change. The `prepareMerchantReceivingChange` helper checks the existing Super Admin permission, MFA, shop match, next revision and a nonempty reason.
2. Record merchant ownership evidence by reference, not wallet recovery material. A valid-looking address is not proof of ownership. The template does not automate an ownership proof.
3. Run the schema validation and preserve the prior private file plus revision for rollback. Keep both outside the public repository and public assets. The example is the only receiving configuration intended for source control.
4. The authorized deployer copies only that shop's reviewed file through the private deployment channel, records file digest, actor, reason, store, revision, deployment version and time, and confirms activation remains disabled. The helper returns an audit summary but does not persist a durable audit record itself; the deployer must retain it with the release evidence.
5. Do not rewrite TokenTrail/wallet_gen treasury configuration or any existing order/invoice destination. Future activation must create a new immutable receiver version and invalidate old unsigned plans/approvals. Existing issued invoices retain their original destination and remain independently reconciled.
6. Roll back by restoring the previous private version and deployment, then record the rollback. A configuration rollback cannot reverse a transfer; this template performs no transfers.

There is currently no receiver-edit web API, no live gateway behind this configuration and no automatic wallet-service integration. Exposing such an API or enabling transfers requires the additional authenticated change-audit implementation and payment acceptance work above.

中文：收款模板默认关闭，填写地址也不会启用支付。只有完成多重验证的超级管理员可授权变更；准备工具校验权限、商城归属、版本及原因，但不自行写入永久审计记录。私密配置由授权部署人员发布并保留旧版、摘要及操作证据，不进入公开源码，也不自动修改钱包服务的归集地址。地址格式有效不代表所有权已验证。现阶段没有收款地址编辑接口或可用网关，不会发生资金操作。
