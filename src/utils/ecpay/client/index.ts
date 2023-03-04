import EcpayPayment from 'ecpay_aio_nodejs/lib/ecpay_payment';
import EcpayInvoice from 'ecpay_invoice_nodejs/lib/ecpay_invoice';
import ecpayOptions from '../conf';
export const ecpayInvoiceClient = () => new EcpayInvoice();
export const ecpayPaymentClient = () => new EcpayPayment(ecpayOptions);
