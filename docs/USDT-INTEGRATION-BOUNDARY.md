# USDT integration boundary — white-label v1

USDT is **not activated**. The storefront must not show an available USDT payment method until the merchant-specific integration and acceptance tests below pass.

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

1. Merchant-selected payment provider and current supported API documentation.
2. Merchant-owned provider account, scoped sandbox/runtime credentials through the private deployment channel, and webhook setup access.
3. Supported chain/token, destination ownership, settlement asset/conversion and fee policy.
4. Underpayment, overpayment, late-payment and refund decisions plus an authorized small acceptance-test budget when ready.

## 中文说明

USDT 尚未启用。每个商城必须独立配置商家自有账户及服务端凭据。启用前需核实链、代币合约、收款归属、确认规则、费用、异常付款、订单退款和对账，并通过沙盒与另行授权的小额实付／退款验收。未知项保持关闭，不能用二维码、模拟支付或接口成功代替结算证据。私有运行环境、钱包账户、签名与运营记录不属于本公开模板。

## Receiver configuration template and controlled change procedure

`config/merchant-payments.example.json` contains no receiving addresses or credentials. Ethereum USDT is marked controlled collection pilot, TRON USDT observation-only, and Base USDT unverified. Every entry is inactive. The schema deliberately accepts only `activation: "disabled"`; neither filling an address nor attesting ownership can activate checkout or collection.

The server-only loader takes an explicit serialized configuration and expected store ID. It does not discover files, read wallet-service configuration, fetch funds, set environment variables, or fall back to another shop. No current checkout handler consumes this template. Address syntax checks are preliminary only: TRON Base58Check, EVM checksum/network support, receiver ownership and settlement suitability require separate verification before any future activation.

To prepare a receiving-address change:

1. The merchant's MFA-authenticated Super Admin selects the correct shop and reviews a proposed private runtime file. Admin, Operator, CSR and other staff cannot authorize this change. The `prepareMerchantReceivingChange` helper checks the existing Super Admin permission, MFA, shop match, next revision and a nonempty reason.
2. Record merchant ownership evidence by reference, not wallet recovery material. A valid-looking address is not proof of ownership. The template does not automate an ownership proof.
3. Run the schema validation and preserve the prior private file plus revision for rollback. Keep both outside the public repository and public assets. The example is the only receiving configuration intended for source control.
4. The authorized deployer copies only that shop's reviewed file through the private deployment channel, records file digest, actor, reason, store, revision, deployment version and time, and confirms activation remains disabled. The helper returns an audit summary but does not persist a durable audit record itself; the deployer must retain it with the release evidence.
5. Do not rewrite any existing wallet-service configuration or issued order/invoice destination. Future activation must create a new immutable receiver version and invalidate old unsigned plans/approvals. Existing issued invoices retain their original destination and remain independently reconciled.
6. Roll back by restoring the previous private version and deployment, then record the rollback. A configuration rollback cannot reverse a transfer; this template performs no transfers.

There is currently no receiver-edit web API, no live gateway behind this configuration and no automatic wallet-service integration. Exposing such an API or enabling transfers requires the additional authenticated change-audit implementation and payment acceptance work above.

中文：收款模板默认关闭，填写地址也不会启用支付。只有完成多重验证的超级管理员可授权变更；准备工具校验权限、商城归属、版本及原因，但不自行写入永久审计记录。私密配置由授权部署人员发布并保留旧版、摘要及操作证据，不进入公开源码，也不自动修改钱包服务的归集地址。地址格式有效不代表所有权已验证。现阶段没有收款地址编辑接口或可用网关，不会发生资金操作。
