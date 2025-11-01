import { useState } from "react";
import "./payment.scss";
import Button from "../../components/ui/button";
import apiRequest from "../../lib/apiRequest";
import toast from "react-hot-toast";

function Payment() {

  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject();
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (amount) => {
    try {
      setLoading(true);
      setPaymentStatus('');

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Failed to load Razorpay SDK. Please check your internet connection.');
        setLoading(false);
        return;
      }

      // Create order
      const orderResponse = await apiRequest.post('/payment/create-order', {
        amount,
        currency: 'INR'
      });

      const { order, key_id } = orderResponse.data;

      // Configure Razorpay options
      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'Techrowth Estate',
        description: 'Test Payment',
        order_id: order.id,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await apiRequest.post('/payment/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyResponse.data.success) {
              setPaymentStatus('success');
              toast.success('Payment Successful! Payment ID: ' + response.razorpay_payment_id);
            } else {
              setPaymentStatus('failed');
              toast.success('Payment verification failed!');
            }
          } catch (error) {
            console.error('Verification error:', error);
            setPaymentStatus('failed');
            toast.success('Payment verification failed!');
          }
        },
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#fece51'
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setPaymentStatus('cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setLoading(false);
    } catch (error) {
      console.error('Payment error:', error);
      setLoading(false);
      setPaymentStatus('failed');
      alert('Failed to initiate payment. Please try again.');
    }
  };

  return (
    <div className="payment">
      <div className="paymentContainer">
        <h1>Choose Your Plan</h1>
        <div className="plans">
          <div className="plan">
            <h2>Basic</h2>
            <h3>₹500/month</h3>
            <ul>
              <li>10 Property Listings</li>
              <li>5 Agent Profiles</li>
              <li>Basic Support</li>
            </ul>
            <Button onClick={() => handlePayment(500)}>Choose Plan</Button>
          </div>
          <div className="plan">
            <h2>Pro</h2>
            <h3>₹1000/month</h3>
            <ul>
              <li>50 Property Listings</li>
              <li>25 Agent Profiles</li>
              <li>Priority Support</li>
            </ul>
            <Button>Choose Plan</Button>
          </div>
          <div className="plan">
            <h2>Premium</h2>
            <h3>₹2000/month</h3>
            <ul>
              <li>Unlimited Property Listings</li>
              <li>Unlimited Agent Profiles</li>
              <li>24/7 Support</li>
            </ul>
            <Button>Choose Plan</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payment;
