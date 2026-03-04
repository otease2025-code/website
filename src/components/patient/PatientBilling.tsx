import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PatientBottomNav } from '../shared/PatientBottomNav';
import { Receipt, Download, ChevronLeft } from 'lucide-react';
import '../../styles/patient-home-background.css';
import { api } from '../../services/api';

interface Bill {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending';
}

export function PatientBilling() {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingInfo, setBillingInfo] = useState<any>(null);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.id) {
          const data = await api.patient.getBilling(user.id);
          setBillingInfo(data);

          // Transform billing data into bills array if available
          if (data.bills && Array.isArray(data.bills)) {
            setBills(data.bills);
          }
        }
      } catch (error) {
        console.error('Failed to fetch billing:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
    const interval = setInterval(fetchBilling, 30000); // 30 seconds for responsive billing updates

    return () => clearInterval(interval);
  }, []);

  const totalBilled = billingInfo?.total || bills.reduce((sum, bill) => sum + bill.amount, 0);
  const totalPaid = billingInfo?.paid || bills.filter(b => b.status === 'paid').reduce((sum, bill) => sum + bill.amount, 0);
  const outstanding = billingInfo?.outstanding || (totalBilled - totalPaid);

  return (
    <div className="min-h-screen patient-home-bg pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-b-[3rem] shadow-xl border-b-4 border-[#9E98ED]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => navigate('/patient/account')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <Receipt className="w-6 h-6 text-[#6328FF]" />
            <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-2xl font-bold text-black">My Bills</h1>
          </div>
          <p className="text-gray-600 ml-12">View your billing details</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {loading ? (
          <div className="bg-[#FFF8E7] rounded-3xl p-12 text-center border border-[#E8D9B5]">
            <div className="animate-spin w-8 h-8 border-4 border-[#6328FF] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading billing information...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#FFF8E7] rounded-2xl p-4 shadow-lg border border-[#E8D9B5] text-center">
                <div className="text-2xl font-bold mb-1 text-gray-800">₹{totalBilled}</div>
                <div className="text-xs text-gray-600 font-medium">Total Billed</div>
              </div>
              <div className="bg-[#FFF8E7] rounded-2xl p-4 shadow-lg border border-[#C2D738] text-center">
                <div className="text-2xl font-bold mb-1 text-[#C2D738]">₹{totalPaid}</div>
                <div className="text-xs text-gray-600 font-medium">Paid</div>
              </div>
              <div className="bg-[#FFF8E7] rounded-2xl p-4 shadow-lg border border-[#FE5C2B] text-center">
                <div className="text-2xl font-bold mb-1 text-[#FE5C2B]">₹{outstanding}</div>
                <div className="text-xs text-gray-600 font-medium">Outstanding</div>
              </div>
            </div>

            {/* Bills List */}
            <div className="bg-[#FFF8E7] rounded-3xl p-6 shadow-lg border border-[#E8D9B5]">
              <h3 className="text-gray-800 font-semibold mb-4">Billing History</h3>
              {bills.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No billing history available yet.</p>
                  <p className="text-sm text-gray-400 mt-1">Bills will appear here once your therapist confirms sessions.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bills.map((bill) => (
                    <div key={bill.id} className="bg-white rounded-xl p-4 hover:shadow-md transition-all border border-[#E8D9B5]">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{bill.description}</p>
                          <p className="text-xs text-gray-500">{bill.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-800">₹{bill.amount}</p>
                          <span className={`text-xs px-3 py-1 rounded-full ${bill.status === 'paid'
                            ? 'bg-[#C2D738]/20 text-[#C2D738]'
                            : 'bg-[#FE5C2B]/20 text-[#FE5C2B]'
                            }`}>
                            {bill.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                          </span>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Info */}
            <div className="bg-[#FFF8E7] rounded-3xl p-6 border border-[#E8D9B5]">
              <h3 className="text-gray-800 font-semibold mb-3">Payment Information</h3>
              <p className="text-sm text-gray-600 mb-2">
                For offline payments, please contact your therapist or visit the clinic reception.
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Note:</span> Billing is managed by your therapist. Contact them for any queries.
              </p>
            </div>
          </>
        )}
      </div>

      <PatientBottomNav />
    </div>
  );
}
