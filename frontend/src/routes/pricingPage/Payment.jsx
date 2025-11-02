import { useState, useEffect, useContext } from "react";
import "./payment.scss";
import Button from "../../components/ui/button";
import apiRequest from "../../lib/apiRequest";
import toast from "react-hot-toast";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Payment() {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [packages, setPackages] = useState([]);
  const [credits, setCredits] = useState(0);
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch credit packages
    const fetchPackages = async () => {
      try {
        const res = await apiRequest.get('/payment/packages');
        setPackages(res.data.packages);
      } catch (error) {
        console.error('Error fetching packages:', error);
        toast.error('Failed to load pricing plans');
      }
    };

    // Fetch user credits if logged in
    const fetchCredits = async () => {
      if (currentUser) {
        try {
          const res = await apiRequest.get('/users/credits');
          setCredits(res.data.credits);
        } catch (error) {
          console.error('Error fetching credits:', error);
        }
      }
    };

    fetchPackages();
    fetchCredits();
  }, [currentUser]);

  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject();
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (packageName) => {
    // Check if user is logged in
    if (!currentUser) {
      toast.error('Please login to purchase credits');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setPaymentStatus('');

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load Razorpay SDK. Please check your internet connection.');
        setLoading(false);
        return;
      }

      // Create order
      const orderResponse = await apiRequest.post('/payment/create-order', {
        packageName
      });

      const { order, key_id, credits: creditsAmount, packageName: pkgName } = orderResponse.data;

      // Configure Razorpay options
      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'Techrowth Estate',
        description: `${pkgName} Plan - ${creditsAmount} Credits`,
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
              setCredits(verifyResponse.data.newBalance);
              toast.success(`Payment Successful! ${verifyResponse.data.creditsAdded} credits added. New balance: ${verifyResponse.data.newBalance}`);
              setTimeout(() => {
                navigate('/profile');
              }, 2000);
            } else {
              setPaymentStatus('failed');
              toast.error('Payment verification failed!');
            }
          } catch (error) {
            console.error('Verification error:', error);
            setPaymentStatus('failed');
            toast.error('Payment verification failed!');
          }
        },
        prefill: {
          name: currentUser?.username || 'User',
          email: currentUser?.email || '',
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
      toast.error(error.response?.data?.message || 'Failed to initiate payment. Please try again.');
    }
  };

  return (
    <div className="payment">
      <div className="paymentContainer">
        {currentUser && (
          <div className="creditsInfo">
            <h3>Your Current Balance: <span className="credits">{credits} Credits</span></h3>
            <p>1 Credit = 1 Property Listing for 30 days</p>
          </div>
        )}
        <h1>Choose Your Plan</h1>
        <div className="plans">
          {packages.length > 0 ? (
            packages.map((pkg) => (
              <div key={pkg.id} className={`plan ${pkg.name === 'Pro' ? 'popular' : ''}`}>
                {pkg.name === 'Pro' && <div className="badge">Most Popular</div>}
                <h2>{pkg.name}</h2>
                <h3>₹{pkg.price / 100}</h3>
                <div className="creditsAmount">{pkg.credits} Credits</div>
                <ul>
                  <li>{pkg.credits} Property Listings</li>
                  <li>30 Days Duration per Listing</li>
                  <li>{pkg.description}</li>
                  <li>₹{(pkg.price / 100 / pkg.credits).toFixed(2)} per listing</li>
                </ul>
                <Button
                  onClick={() => handlePayment(pkg.name)}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Buy Now'}
                </Button>
              </div>
            ))
          ) : (
            <p>Loading plans...</p>
          )}
        </div>
        {!currentUser && (
          <div className="loginPrompt">
            <p>Please <button onClick={() => navigate('/login')}>login</button> to purchase credits</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Payment;
