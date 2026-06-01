import { X, Download, Printer } from 'lucide-react';
import { Payment } from '../lib/api';

interface ReceiptProps {
  payment: Payment;
  onClose: () => void;
}

export default function PaymentReceipt({ payment, onClose }: ReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const element = document.getElementById('receipt-content');
    if (!element) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = 800;
    canvas.height = 1000;

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = 'bold 32px Arial';
    context.fillStyle = '#000000';
    context.textAlign = 'center';
    context.fillText('CAPITALIST CARTEL', canvas.width / 2, 60);

    context.font = 'bold 24px Arial';
    context.fillText('PAYMENT RECEIPT', canvas.width / 2, 120);

    let yPos = 200;
    const lineHeight = 40;
    context.font = '16px Arial';
    context.textAlign = 'left';

    const details = [
      `Receipt #: ${payment.id.slice(0, 8).toUpperCase()}`,
      `Date: ${new Date(payment.payment_date).toLocaleDateString('en-IN')}`,
      `Client: ${payment.client?.name || 'N/A'}`,
      `Handler: ${payment.handler?.full_name || 'N/A'}`,
      `Payment Method: ${payment.payment_method}`,
      '',
      `Amount: ₹${Number(payment.amount).toLocaleString('en-IN')}`,
      `Received (90%): ₹${Number(payment.received_amount).toLocaleString('en-IN')}`,
      `Deduction (10%): ₹${(Number(payment.amount) * 0.1).toLocaleString('en-IN')}`,
      '',
      `Status: COMPLETED`,
    ];

    details.forEach((detail) => {
      context.fillText(detail, 50, yPos);
      yPos += lineHeight;
    });

    context.font = '12px Arial';
    context.fillText('Thank you for your business!', 50, yPos + 40);

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `Receipt_${payment.id.slice(0, 8)}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:bg-white print:p-0">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto print:rounded-none print:shadow-none print:max-w-full print:max-h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 print:border-b-2 print:pb-4">
          <h2 className="text-xl font-bold text-gray-900">Payment Receipt</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors print:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content */}
        <div id="receipt-content" className="p-6 space-y-6">
          {/* Company Header */}
          <div className="text-center border-b-2 border-emerald-600 pb-4">
            <h1 className="text-3xl font-bold text-emerald-600 mb-1">CAPITALIST CARTEL</h1>
            <p className="text-sm text-gray-600">Professional Payment Management</p>
          </div>

          {/* Receipt Number and Date */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase">Receipt #</p>
              <p className="text-lg font-bold text-gray-900">{payment.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase">Date</p>
              <p className="text-lg font-bold text-gray-900">
                {new Date(payment.payment_date).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase">Client</p>
              <p className="text-sm font-semibold text-gray-900">{payment.client?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase">Handler</p>
              <p className="text-sm font-semibold text-gray-900">{payment.handler?.full_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase">Payment Method</p>
              <p className="text-sm font-semibold text-gray-900">{payment.payment_method}</p>
            </div>
          </div>

          {/* Amount Details */}
          <div className="border-t-2 border-b-2 border-gray-200 py-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Total Amount</span>
              <span className="text-lg font-bold text-gray-900">₹{Number(payment.amount).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center text-amber-600">
              <span className="text-sm">Deduction (10%)</span>
              <span className="text-sm font-semibold">-₹{(Number(payment.amount) * 0.1).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-lg">
              <span className="font-semibold text-gray-900">Amount Received (90%)</span>
              <span className="text-xl font-bold text-emerald-600">₹{Number(payment.received_amount).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Status */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs font-medium text-gray-600 uppercase mb-1">Status</p>
            <p className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
              COMPLETED
            </p>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">Thank you for your business!</p>
            <p className="text-xs text-gray-500 mt-2">© 2026 Capitalist Cartel. All rights reserved.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 p-6 border-t border-gray-200 bg-gray-50 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
