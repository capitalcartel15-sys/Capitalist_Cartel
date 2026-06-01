import { X, Download, Printer, TrendingUp } from 'lucide-react';
import { Payment } from '../lib/api';

interface ReceiptProps {
  payment: Payment;
  onClose: () => void;
}

const COMPANY = {
  name: 'Capitalist Cartel',
  tagline: 'Professional Stock Advisory',
  email: 'support@capitalistcartel.com',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function PaymentReceipt({ payment, onClose }: ReceiptProps) {
  const gross = Number(payment.amount);

  const receiptNo = `${payment.id.slice(0, 4)}-${payment.id.slice(4, 8)}`.toUpperCase();
  const paidOn = formatDate(payment.payment_date);
  const method = (payment.payment_method || '').replace(/_/g, ' ');

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = 820 * scale;
    canvas.height = 1000 * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(scale, scale);

    const left = 56;
    const right = 764;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 820, 1000);

    // Title + brand
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.font = 'bold 34px Arial';
    ctx.fillText('Receipt', left, 70);

    ctx.textAlign = 'right';
    ctx.font = 'bold 26px Arial';
    ctx.fillText(COMPANY.name, right, 64);
    ctx.font = '14px Arial';
    ctx.fillStyle = '#64748b';
    ctx.fillText(COMPANY.tagline, right, 88);

    // Meta
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 13px Arial';
    ctx.fillText('RECEIPT NUMBER', left, 130);
    ctx.fillText('DATE PAID', left, 156);
    ctx.fillText('PAYMENT METHOD', left, 182);
    ctx.fillStyle = '#0f172a';
    ctx.font = '14px Arial';
    ctx.fillText(receiptNo, left + 160, 130);
    ctx.fillText(paidOn, left + 160, 156);
    ctx.fillText(method || 'N/A', left + 160, 182);

    // Parties
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 13px Arial';
    ctx.fillText('FROM', left, 240);
    ctx.fillText('BILL TO', 430, 240);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px Arial';
    ctx.fillText(COMPANY.name, left, 266);
    ctx.fillText(payment.client?.name || 'N/A', 430, 266);
    ctx.fillStyle = '#475569';
    ctx.font = '13px Arial';
    ctx.fillText(COMPANY.tagline, left, 288);
    ctx.fillText(COMPANY.email, left, 308);
    if (payment.client?.phone) ctx.fillText(payment.client.phone, 430, 288);
    if (payment.client?.email) ctx.fillText(payment.client.email, 430, 308);
    if (payment.handler?.full_name) ctx.fillText(`Handler: ${payment.handler.full_name}`, 430, 328);

    // Headline
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px Arial';
    ctx.fillText(`${formatCurrency(gross)} paid on ${paidOn}`, left, 390);

    // Table
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(left, 420);
    ctx.lineTo(right, 420);
    ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('DESCRIPTION', left, 444);
    ctx.textAlign = 'right';
    ctx.fillText('AMOUNT', right, 444);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = '15px Arial';
    ctx.fillText('Stock Advisory Service Payment', left, 478);
    ctx.textAlign = 'right';
    ctx.fillText(formatCurrency(gross), right, 478);

    const rows: Array<[string, string, boolean]> = [
      ['Subtotal', formatCurrency(gross), false],
      ['Total', formatCurrency(gross), false],
      ['Amount paid', formatCurrency(gross), true],
    ];
    let y = 520;
    rows.forEach(([label, value, bold]) => {
      ctx.strokeStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.moveTo(430, y - 18);
      ctx.lineTo(right, y - 18);
      ctx.stroke();
      ctx.textAlign = 'left';
      ctx.fillStyle = bold ? '#0f172a' : '#475569';
      ctx.font = bold ? 'bold 15px Arial' : '14px Arial';
      ctx.fillText(label, 430, y);
      ctx.textAlign = 'right';
      ctx.fillText(value, right, y);
      y += 30;
    });

    // Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Arial';
    ctx.fillText('Thank you for your business!', 410, 640);
    ctx.fillText(`© ${new Date().getFullYear()} ${COMPANY.name}. All rights reserved.`, 410, 660);

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `Receipt_${receiptNo}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:bg-white print:p-0">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto print:rounded-none print:shadow-none print:max-w-full print:max-h-full">
        {/* Modal toolbar (hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 print:hidden">
          <span className="text-sm font-medium text-gray-500">Payment Receipt</span>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Receipt document */}
        <div id="receipt-content" className="px-8 py-10 sm:px-12">
          {/* Header: title + brand */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Receipt</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="leading-tight">
                <p className="text-lg font-bold text-gray-900">{COMPANY.name}</p>
                <p className="text-xs text-gray-500">{COMPANY.tagline}</p>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="mt-8 space-y-1.5 text-sm">
            <div className="flex gap-3">
              <span className="w-36 font-semibold text-gray-500">Receipt number</span>
              <span className="font-medium text-gray-900">{receiptNo}</span>
            </div>
            <div className="flex gap-3">
              <span className="w-36 font-semibold text-gray-500">Date paid</span>
              <span className="font-medium text-gray-900">{paidOn}</span>
            </div>
            <div className="flex gap-3">
              <span className="w-36 font-semibold text-gray-500">Payment method</span>
              <span className="font-medium text-gray-900 capitalize">{method || 'N/A'}</span>
            </div>
          </div>

          {/* Parties */}
          <div className="mt-8 grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="font-bold text-gray-900">{COMPANY.name}</p>
              <p className="text-gray-600 mt-1">{COMPANY.tagline}</p>
              <p className="text-gray-600">{COMPANY.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Bill to</p>
              <p className="font-semibold text-gray-900">{payment.client?.name || 'N/A'}</p>
              {payment.client?.phone && <p className="text-gray-600">{payment.client.phone}</p>}
              {payment.client?.email && <p className="text-gray-600 break-all">{payment.client.email}</p>}
              {payment.handler?.full_name && (
                <p className="text-gray-500 mt-1">Handled by {payment.handler.full_name}</p>
              )}
            </div>
          </div>

          {/* Headline */}
          <div className="mt-10">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(gross)} <span className="font-normal text-gray-500">paid on {paidOn}</span>
            </p>
          </div>

          {/* Line items */}
          <div className="mt-6">
            <div className="grid grid-cols-12 border-b border-gray-200 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <span className="col-span-9">Description</span>
              <span className="col-span-3 text-right">Amount</span>
            </div>
            <div className="grid grid-cols-12 py-3 text-sm">
              <div className="col-span-9">
                <p className="font-medium text-gray-900">Stock Advisory Service Payment</p>
                {payment.notes && <p className="text-gray-500 mt-0.5">{payment.notes}</p>}
              </div>
              <span className="col-span-3 text-right font-medium text-gray-900">{formatCurrency(gross)}</span>
            </div>

            {/* Totals */}
            <div className="ml-auto w-full sm:w-2/3 text-sm">
              <div className="flex justify-between border-t border-gray-100 py-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{formatCurrency(gross)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 py-2">
                <span className="text-gray-600">Total</span>
                <span className="font-medium text-gray-900">{formatCurrency(gross)}</span>
              </div>
              <div className="flex justify-between border-t-2 border-gray-200 py-2.5">
                <span className="font-bold text-gray-900">Amount paid</span>
                <span className="font-bold text-emerald-600">{formatCurrency(gross)}</span>
              </div>
            </div>
          </div>

          {/* Payment history */}
          <div className="mt-10">
            <h2 className="text-lg font-bold text-gray-900">Payment history</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="py-2 font-semibold">Method</th>
                    <th className="py-2 font-semibold">Date</th>
                    <th className="py-2 font-semibold text-right">Amount paid</th>
                    <th className="py-2 font-semibold text-right">Receipt number</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 capitalize text-gray-900">{method || 'N/A'}</td>
                    <td className="py-3 text-gray-700">{paidOn}</td>
                    <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(gross)}</td>
                    <td className="py-3 text-right text-gray-700">{receiptNo}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 border-t border-gray-100 pt-5 text-center">
            <p className="text-sm text-gray-600">Thank you for your business!</p>
            <p className="text-xs text-gray-400 mt-1">
              © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-8 py-5 border-t border-gray-200 bg-gray-50 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
