import { useState } from 'react';
import axios from 'axios';
import './paymentDemo.scss';

function PaymentDemo() {
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
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
      const orderResponse = await axios.post('http://localhost:8800/api/payment/create-order', {
        amount: amount,
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
            const verifyResponse = await axios.post('http://localhost:8800/api/payment/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyResponse.data.success) {
              setPaymentStatus('success');
              alert('Payment Successful! Payment ID: ' + response.razorpay_payment_id);
            } else {
              setPaymentStatus('failed');
              alert('Payment verification failed!');
            }
          } catch (error) {
            console.error('Verification error:', error);
            setPaymentStatus('failed');
            alert('Payment verification failed!');
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
          ondismiss: function() {
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
    <div className="paymentDemo">
      <div className="paymentContainer">
        <h1>Razorpay Payment Demo</h1>
        <p className="description">
          This is a sandbox payment demonstration using Razorpay test credentials.
          No real money will be charged.
        </p>

        <div className="paymentForm">
          <div className="formGroup">
            <label htmlFor="amount">Enter Amount (INR):</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min="1"
              placeholder="Enter amount"
            />
          </div>

          <button
            className="payButton"
            onClick={handlePayment}
            disabled={loading || amount < 1}
          >
            {loading ? 'Processing...' : `Pay ₹${amount}`}
          </button>

          {paymentStatus && (
            <div className={`status ${paymentStatus}`}>
              {paymentStatus === 'success' && '✓ Payment Successful!'}
              {paymentStatus === 'failed' && '✗ Payment Failed!'}
              {paymentStatus === 'cancelled' && 'Payment Cancelled'}
            </div>
          )}
        </div>

        <div className="testInfo">
          <h3>Test Payment Methods:</h3>

          <div className="testMethod">
            <h4>Option 1: UPI (Recommended)</h4>
            <ul>
              <li><strong>UPI ID:</strong> success@razorpay</li>
              <li>This will simulate a successful payment</li>
            </ul>
          </div>

          <div className="testMethod">
            <h4>Option 2: Netbanking</h4>
            <ul>
              <li>Select any bank from the list</li>
              <li>All test bank options will work in sandbox mode</li>
            </ul>
          </div>

          <div className="testMethod">
            <h4>Option 3: Cards (Domestic Only)</h4>
            <ul>
              <li><strong>Card Number:</strong> 5267 3181 8797 5449 (Mastercard)</li>
              <li><strong>Card Number:</strong> 4012 8888 8888 1881 (Visa)</li>
              <li><strong>Expiry:</strong> Any future date (e.g., 12/25)</li>
              <li><strong>CVV:</strong> Any 3 digits (e.g., 123)</li>
              <li><strong>Name:</strong> Any name</li>
            </ul>
          </div>

          <p className="note">
            <strong>Note:</strong> International cards are not enabled in test mode. Use UPI or Netbanking for easiest testing.
          </p>
        </div>

        <div className="features">
          <h3>Payment Features:</h3>
          <ul>
            <li>Secure payment gateway integration</li>
            <li>Real-time payment verification</li>
            <li>Support for multiple payment methods</li>
            <li>Automated receipt generation</li>
            <li>Payment status tracking</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default PaymentDemo;
