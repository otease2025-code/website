import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TherapistBottomNav } from '../shared/TherapistBottomNav';
import { ArrowLeft, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../../services/api';

export function TherapistBilling() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState<any[]>([]);
    const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
    const [patientBills, setPatientBills] = useState<any[]>([]);

    // New bill states
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');
    const [paymentMethod, setPaymentMethod] = useState<string>('Cash');

    // UI tabs within patient
    const [activeTab, setActiveTab] = useState<'new_bill' | 'unpaid_bills'>('new_bill');

    useEffect(() => {
        const fetchPatients = () => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.id) {
                api.therapist.getPatients(user.id).then(setPatients).catch(console.error);
            }
        };

        fetchPatients();
        const interval = setInterval(fetchPatients, 120000);
        return () => clearInterval(interval);
    }, []);

    const handlePayment = async (patientId: string) => {
        if (!amount) {
            alert('Please enter amount');
            return;
        }
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const billingPayload: any = {
                patient_id: patientId,
                amount: parseFloat(amount),
                status: paymentStatus === 'paid' ? 'PAID' : 'PENDING',
            };
            if (description && description.trim()) {
                billingPayload.description = description.trim();
            }
            if (paymentStatus === 'paid' && paymentMethod) {
                billingPayload.payment_method = paymentMethod;
            }
            await api.therapist.confirmBilling(user.id, billingPayload);
            alert('Payment recorded successfully!');
            setExpandedPatientId(null);
            setAmount('');
            setDescription('');
        } catch (error: any) {
            console.error('Billing error:', error);
            alert('Error: ' + (error.message || 'Failed to record billing'));
        }
    };

    const loadPatientBills = async (patientId: string) => {
        try {
            const data = await api.therapist.getPatientBilling(patientId);
            setPatientBills(data.bills || []);
        } catch (err) {
            console.error('Failed to load bills:', err);
        }
    };

    const handleMarkPaid = async (billId: string) => {
        if (!expandedPatientId) return;
        try {
            await api.therapist.markBillAsPaid(billId, paymentMethod);
            alert('Bill marked as paid!');
            // Refresh bills
            await loadPatientBills(expandedPatientId);
        } catch (error: any) {
            alert('Error: ' + (error.message || 'Failed to update bill'));
        }
    };

    const toggleExpand = (patientId: string) => {
        if (expandedPatientId === patientId) {
            setExpandedPatientId(null);
        } else {
            setExpandedPatientId(patientId);
            setAmount('');
            setDescription('');
            setPaymentStatus('paid');
            setPaymentMethod('Cash');
            setActiveTab('new_bill');
            loadPatientBills(patientId);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => navigate('/therapist/home')}
                        className="flex items-center gap-2 text-gray-600 mb-3 hover:text-gray-800"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Home
                    </button>
                    <h1 style={{ fontFamily: 'Oxanium, sans-serif' }} className="text-gray-800 flex items-center gap-2">
                        <DollarSign className="w-7 h-7 text-green-600" />
                        Billing Control
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manage patient payments</p>
                </div>
            </div>

            <div className="max-w-md mx-auto p-6 flex flex-col items-center justify-center space-y-4">

                {/* Patient List with Embedded Billing */}
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 w-full">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">Linked Patients</h2>
                    <div className="space-y-3">
                        {patients.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No patients linked yet</p>
                        ) : (
                            patients.map(p => (
                                <div key={p.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                                    <div
                                        onClick={() => toggleExpand(p.id)}
                                        className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <div>
                                            <p className="font-semibold text-gray-800 text-sm">{p.name || p.email}</p>
                                            <p className="text-xs text-gray-500">ID: {p.id.slice(0, 8)}...</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-blue-600 font-medium">Record Payment</span>
                                            {expandedPatientId === p.id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                                        </div>
                                    </div>

                                    {/* Embedded Billing Panel */}
                                    {expandedPatientId === p.id && (
                                        <div className="bg-white border-t border-gray-200 animate-in slide-in-from-top-2 duration-200">

                                            {/* Tabs */}
                                            <div className="flex border-b border-gray-100">
                                                <button
                                                    onClick={() => setActiveTab('new_bill')}
                                                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'new_bill' ? 'text-[#6328FF] border-b-2 border-[#6328FF] bg-[#6328FF]/5' : 'text-gray-500 hover:bg-gray-50'}`}
                                                >
                                                    + New Bill
                                                </button>
                                                <button
                                                    onClick={() => setActiveTab('unpaid_bills')}
                                                    className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'unpaid_bills' ? 'text-[#FE5C2B] border-b-2 border-[#FE5C2B] bg-[#FE5C2B]/5' : 'text-gray-500 hover:bg-gray-50'}`}
                                                >
                                                    Unpaid Bills
                                                    {patientBills.filter(b => b.status === "pending").length > 0 && (
                                                        <span className="bg-[#FE5C2B] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                                            {patientBills.filter(b => b.status === "pending").length}
                                                        </span>
                                                    )}
                                                </button>
                                            </div>

                                            {/* New Bill Tab Context */}
                                            {activeTab === 'new_bill' ? (
                                                <div className="p-4 space-y-4">
                                                    {/* Description */}
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g., Therapy Session, OT Assessment"
                                                            value={description}
                                                            onChange={(e) => setDescription(e.target.value)}
                                                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-[#6328FF] focus:outline-none text-sm text-gray-800"
                                                        />
                                                    </div>

                                                    {/* Amount */}
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Amount (₹)</label>
                                                        <input
                                                            type="number"
                                                            placeholder="Enter amount"
                                                            value={amount}
                                                            onChange={(e) => setAmount(e.target.value)}
                                                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-[#6328FF] focus:outline-none text-sm text-gray-800"
                                                        />
                                                    </div>

                                                    {/* Status */}
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <button
                                                                onClick={() => setPaymentStatus('paid')}
                                                                style={{
                                                                    padding: '8px 12px',
                                                                    borderRadius: '8px',
                                                                    fontSize: '12px',
                                                                    fontWeight: 700,
                                                                    border: paymentStatus === 'paid' ? '2px solid #C2D738' : '2px solid #d1d5db',
                                                                    backgroundColor: paymentStatus === 'paid' ? '#C2D738' : '#f9fafb',
                                                                    color: 'black',
                                                                    cursor: 'pointer',
                                                                }}
                                                            >
                                                                ✓ Paid
                                                            </button>
                                                            <button
                                                                onClick={() => setPaymentStatus('pending')}
                                                                style={{
                                                                    padding: '8px 12px',
                                                                    borderRadius: '8px',
                                                                    fontSize: '12px',
                                                                    fontWeight: 700,
                                                                    border: paymentStatus === 'pending' ? '2px solid #FE5C2B' : '2px solid #d1d5db',
                                                                    backgroundColor: paymentStatus === 'pending' ? '#FE5C2B' : '#f9fafb',
                                                                    color: 'black',
                                                                    cursor: 'pointer',
                                                                }}
                                                            >
                                                                ⏳ Not Paid
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Method (Only if Paid) */}
                                                    {paymentStatus === 'paid' && (
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Method</label>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {['UPI', 'Cash', 'Cheque', 'Card'].map((method) => (
                                                                    <button
                                                                        key={method}
                                                                        onClick={() => setPaymentMethod(method)}
                                                                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border ${paymentMethod === method ? 'bg-[#C2D738] text-black border-[#C2D738]' : 'bg-gray-50 border-gray-300'}`}
                                                                    >
                                                                        {method}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-2 pt-2">
                                                        <button
                                                            onClick={() => setExpandedPatientId(null)}
                                                            className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handlePayment(p.id)}
                                                            className="flex-1 py-2 bg-gradient-to-r from-[#6328FF] to-[#9E98ED] text-white rounded-lg text-xs font-semibold hover:shadow-md"
                                                        >
                                                            Save Record
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Unpaid Bills Tab */
                                                <div className="p-4 space-y-3 bg-gray-50 max-h-80 overflow-y-auto">
                                                    {patientBills.filter(b => b.status === 'pending').length === 0 ? (
                                                        <p className="text-center text-sm text-gray-500 py-4">No unpaid bills for this patient</p>
                                                    ) : (
                                                        patientBills.filter(b => b.status === 'pending').map(bill => (
                                                            <div key={bill.id} className="bg-white p-3 rounded-lg border border-orange-200 shadow-sm">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div>
                                                                        <p className="font-bold text-gray-800 text-sm">₹{bill.amount}</p>
                                                                        <p className="text-xs text-gray-500">{bill.description}</p>
                                                                        <p className="text-[10px] text-gray-400 mt-0.5">{bill.date}</p>
                                                                    </div>
                                                                    <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold">UNPAID</span>
                                                                </div>

                                                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                                                                    <div className="flex-1">
                                                                        <select
                                                                            className="w-full text-xs p-1.5 border border-gray-200 rounded text-gray-700 bg-gray-50"
                                                                            value={paymentMethod}
                                                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                                                        >
                                                                            <option value="Cash">Cash</option>
                                                                            <option value="UPI">UPI</option>
                                                                            <option value="Card">Card</option>
                                                                            <option value="Cheque">Cheque</option>
                                                                        </select>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleMarkPaid(bill.id)}
                                                                        className="flex-1 bg-[#C2D738] hover:bg-[#aebd33] text-black text-xs font-bold py-1.5 px-3 rounded transition-colors"
                                                                    >
                                                                        Mark Paid
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <TherapistBottomNav />
        </div>
    );
}
