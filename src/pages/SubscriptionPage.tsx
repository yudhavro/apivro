import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import { Check, Zap, Receipt } from 'lucide-react';
import { Modal } from '../components/Modal';

interface Plan {
  id: string;
  name: string;
  slug: string;
  message_limit: number;
  price_monthly: number;
  price_yearly: number;
}

interface Subscription {
  id: string;
  plan_id: string;
  messages_used: number;
  status: string;
  end_date: string | null;
  subscription_plans: Plan;
}

interface PaymentChannel {
  code: string;
  name: string;
  fee: number;
  fee_percent?: number;
  icon_url?: string;
}

export function SubscriptionPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentChannels, setPaymentChannels] = useState<PaymentChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    try {
      const [plansData, subscriptionData] = await Promise.all([
        supabase.from('subscription_plans').select('*').eq('is_active', true).order('price_monthly'),
        supabase
          .from('subscriptions')
          .select('*, subscription_plans(*)')
          .eq('user_id', user!.id)
          .eq('status', 'active')
          .maybeSingle(),
      ]);

      if (plansData.error) throw plansData.error;
      if (subscriptionData.error) throw subscriptionData.error;

      setPlans(plansData.data || []);
      setCurrentSubscription(subscriptionData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getPlanFeatures(plan: Plan) {
    const features = [
      `${plan.message_limit.toLocaleString()} ${t.subscription.messagesPerMonth}`,
      'Multiple devices support',
      'API access',
      'Webhook integration',
    ];

    if (plan.slug === 'basic' || plan.slug === 'enterprise') {
      features.push('Priority support');
    }

    if (plan.slug === 'enterprise') {
      features.push('Custom webhook URL');
      features.push('Advanced analytics');
    }

    return features;
  }

  function isCurrentPlan(planId: string) {
    return currentSubscription?.plan_id === planId;
  }

  async function handleUpgrade(plan: Plan) {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
    
    // Load payment channels
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/payments/channels`);
      const data = await response.json();
      
      if (data.success) {
        setPaymentChannels(data.channels);
        setSelectedChannel(data.channels[0]?.code || '');
      }
    } catch (error) {
      console.error('Error loading payment channels:', error);
    }
  }

  async function handlePayment() {
    if (!selectedPlan || !selectedChannel) return;

    setProcessing(true);

    try {
      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Please login first');
        setProcessing(false);
        return;
      }

      // Create payment
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          payment_method: selectedChannel,
        }),
      });

      const data = await response.json();

      if (data.success && data.payment.checkout_url) {
        // Redirect to Tripay checkout
        window.location.href = data.payment.checkout_url;
      } else {
        alert(data.message || 'Failed to create payment');
        setProcessing(false);
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Failed to create payment. Please try again.');
      setProcessing(false);
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  function calculateTotal(amount: number, channelCode: string): number {
    const channel = paymentChannels.find(c => c.code === channelCode);
    if (!channel) return amount;

    let fee = channel.fee || 0;
    if (channel.fee_percent) {
      fee += Math.ceil(amount * (channel.fee_percent / 100));
    }

    return amount + fee;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">{t.common.loading}</div>
      </div>
    );
  }

  const usagePercentage = currentSubscription
    ? (currentSubscription.messages_used /
        currentSubscription.subscription_plans.message_limit) *
      100
    : 0;

  return (
    <>
    <div className="space-y-8">
      {/* Header with Payment History Button */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.subscription.title}</h1>
          <p className="text-slate-600 mt-1">
            Choose the plan that fits your needs
          </p>
        </div>
        <button
          onClick={() => navigate('/subscription/history')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Receipt className="w-4 h-4" />
          Payment History
        </button>
      </div>

      {currentSubscription && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {t.subscription.currentPlan}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">{t.subscription.usage}</p>
              <p className="text-2xl font-bold text-slate-900">
                {currentSubscription.messages_used.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">
                of {currentSubscription.subscription_plans.message_limit.toLocaleString()} messages
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-600 mb-1">Plan</p>
              <p className="text-2xl font-bold text-slate-900">
                {currentSubscription.subscription_plans.name}
              </p>
              <p className="text-sm text-slate-500">
                {formatCurrency(
                  billingCycle === 'monthly'
                    ? currentSubscription.subscription_plans.price_monthly
                    : currentSubscription.subscription_plans.price_yearly
                )}
                {billingCycle === 'monthly' ? t.subscription.perMonth : t.subscription.perYear}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-600 mb-1">Status</p>
              <p className="text-2xl font-bold text-green-600">{currentSubscription.status}</p>
              {currentSubscription.end_date && (
                <p className="text-sm text-slate-500">
                  {t.subscription.expiresOn}{' '}
                  {new Date(currentSubscription.end_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  usagePercentage > 90
                    ? 'bg-red-500'
                    : usagePercentage > 70
                    ? 'bg-yellow-500'
                    : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">{usagePercentage.toFixed(1)}% used</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            billingCycle === 'monthly'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {t.subscription.monthly}
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            billingCycle === 'yearly'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {t.subscription.yearly}
          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
            Save 17%
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = isCurrentPlan(plan.id);
          const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
          const isEnterprise = plan.slug === 'enterprise';

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border-2 p-6 transition-all ${
                isEnterprise
                  ? 'border-blue-600 shadow-xl scale-105'
                  : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              {isEnterprise && (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mb-4">
                  <Zap className="w-3 h-3" />
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-slate-900">{formatCurrency(price)}</span>
                  <span className="text-slate-600">
                    {billingCycle === 'monthly' ? t.subscription.perMonth : t.subscription.perYear}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {getPlanFeatures(plan).map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan)}
                disabled={isCurrent}
                className={`w-full py-3 rounded-xl font-medium transition-colors ${
                  isCurrent
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : isEnterprise
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {isCurrent ? t.subscription.current : plan.slug === 'free' ? 'Free Forever' : t.subscription.upgrade}
              </button>
            </div>
          );
        })}
      </div>
    </div>

      {/* Payment Modal - Using reusable Modal component */}
      <Modal
        isOpen={showPaymentModal && !!selectedPlan}
        onClose={() => setShowPaymentModal(false)}
        title="Choose Payment Method"
        maxWidth="md"
      >
        {selectedPlan && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-slate-600 mb-1">Selected Plan</p>
              <p className="text-lg font-bold text-slate-900">{selectedPlan.name}</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {formatCurrency(selectedPlan.price_monthly)}
                <span className="text-sm font-normal text-slate-600">/month</span>
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Payment Method
              </label>
                {paymentChannels.map((channel) => (
                  <label
                    key={channel.code}
                    className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedChannel === channel.code
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="radio"
                        name="payment_method"
                        value={channel.code}
                        checked={selectedChannel === channel.code}
                        onChange={(e) => setSelectedChannel(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      {channel.icon_url && (
                        <img 
                          src={channel.icon_url} 
                          alt={channel.name}
                          className="w-10 h-10 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{channel.name}</p>
                        <p className="text-xs text-slate-500">
                          Fee: {formatCurrency(channel.fee)}
                          {channel.fee_percent && ` + ${channel.fee_percent}%`}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
            </div>

            {selectedChannel && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(selectedPlan.price_monthly)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Payment Fee</span>
                  <span className="font-medium">
                    {formatCurrency(calculateTotal(selectedPlan.price_monthly, selectedChannel) - selectedPlan.price_monthly)}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(calculateTotal(selectedPlan.price_monthly, selectedChannel))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={processing || !selectedChannel}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? 'Processing...' : 'Continue to Payment'}
            </button>
          </>
        )}
      </Modal>
    </>
  );
}
