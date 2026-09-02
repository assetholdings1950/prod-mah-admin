import { redirect } from "next/navigation";

export default function PaymentMethodsIndex() {
    redirect("/finance/payment-methods/all");
}
