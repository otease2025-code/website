import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { TherapistBottomNav } from '../shared/TherapistBottomNav';
import { api } from '../../services/api';

interface Bill {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: string;
  payment_method?: string;
  added_by: string;
}

interface BillingData {
  total: number;
  paid: number;
  outstanding: number;
  bills: Bill[];
}

export function PatientBillingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState('Patient');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const billing = await api.therapist.getPatientBilling(id);
        setBillingData(billing);

        // Try to get patient name from parent's stored data
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.id) {
          const patients = await api.therapist.getPatients(user.id);
          const patient = patients.find((p: any) => p.id === id);
          if (patient) setPatientName(patient.name || patient.email);
        }
      } catch (error) {
        console.error('Failed to fetch billing:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6328FF]" />
      </div>
    );
  }

  const totalBilled = billingData?.total || 0;
  const totalPaid = billingData?.paid || 0;
  const outstanding = billingData?.outstanding || 0;
  const bills = billingData?.bills || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/therapist/billing')}
            className="flex items-center gap-2 text-gray-600 mb-3 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Billing
          </button>
          <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-gray-800">{patientName} - Billing</h1>
          <div className="flex gap-4 mt-2 text-sm text-gray-500">
            <span>Patient ID: {id?.substring(0, 8)}...</span>
          </div>
        </div>
      </div>

      {/* Billing Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {/* Billing History */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📋 Billing History</h3>
          <div className="space-y-3">
            {bills.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">No billing records yet.</p>
                <p className="text-sm text-gray-400 mt-1">Bills will appear here once you record payments.</p>
              </div>
            ) : (
              bills.map((bill) => (
                <div
                  key={bill.id}
                  className={`bg-gradient-to-r ${bill.status === 'paid'
                      ? 'from-green-50 to-emerald-50 border-l-4 border-green-500'
                      : 'from-orange-50 to-amber-50 border-l-4 border-orange-500'
                    } rounded-lg p-4`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-base">{bill.description}</p>
                      <p className="text-sm text-gray-600 mt-1">Date: {bill.date}</p>
                      <p className="text-xs text-gray-500 mt-1">Added by: {bill.added_by}</p>
                      {bill.payment_method && bill.status === 'paid' && (
                        <p className="text-xs text-gray-500 mt-1">Method: {bill.payment_method}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-2xl ${bill.status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                        ₹{bill.amount.toLocaleString()}
                      </p>
                      <span
                        className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-semibold ${bill.status === 'paid'
                            ? 'bg-green-500 text-white'
                            : 'bg-orange-500 text-white'
                          }`}
                      >
                        {bill.status === 'paid' ? '✓ PAID' : '⏳ PENDING'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 shadow-lg border-2 border-purple-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">💵 Financial Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-gray-700 font-semibold">Total Billed:</span>
              <span className="text-2xl font-bold text-gray-800">₹{totalBilled.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-gray-700 font-semibold">Total Paid:</span>
              <span className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg border-2 border-orange-300">
              <span className="text-gray-700 font-bold">Outstanding Balance:</span>
              <span className="text-3xl font-bold text-orange-600">₹{outstanding.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Patient can view all billing details in their account. Outstanding payments should be collected during next visit.
            </p>
          </div>
        </div>
      </div>

      <TherapistBottomNav />
    </div>
  );
}
