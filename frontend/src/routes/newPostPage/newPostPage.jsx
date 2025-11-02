import { useState, useEffect } from "react";
import "./newPostPage.scss";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useNavigate } from "react-router-dom";
import apiRequest from "../../lib/apiRequest";
import toast from "react-hot-toast";

import Button from "../../components/ui/button";

function NewPostPage() {
  const [value, setValue] = useState('');
  const [images, setImages] = useState([
    '/house1.jpg',
    '/house2.jpg',
    '/house3.jpg'
  ]); // Default placeholder images
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(0);
  const [showCreditModal, setShowCreditModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user credits
    const fetchCredits = async () => {
      try {
        const res = await apiRequest.get('/users/credits');
        setCredits(res.data.credits);
      } catch (error) {
        console.error('Error fetching credits:', error);
      }
    };

    fetchCredits();
  }, []);

  const handleSubmit = async (e, publish = false) => {
    e.preventDefault();

    // Check if publishing and user has no credits
    if (publish && credits < 1) {
      setShowCreditModal(true);
      return;
    }

    const formData = new FormData(e.target);
    const inputs = Object.fromEntries(formData);

    setLoading(true);
    setError("");

    try {
      const res = await apiRequest.post("/posts/", {
        postData: {
          title: inputs.title,
          price: parseInt(inputs.price),
          address: inputs.address,
          city: inputs.city,
          bedroom: parseInt(inputs.bedroom),
          bathroom: parseInt(inputs.bathroom),
          type: inputs.type,
          property: inputs.property,
          latitude: inputs.latitude,
          longitude: inputs.longitude,
          images: images
        },
        postDetail: {
          desc: value,
          utilities: inputs.utilities,
          pet: inputs.pet,
          income: inputs.income,
          size: parseInt(inputs.size),
          school: parseInt(inputs.school),
          bus: parseInt(inputs.bus),
          restaurant: parseInt(inputs.restaurant)
        },
        publish: publish
      });

      if (publish) {
        toast.success(`Property published! ${res.data.creditsRemaining} credits remaining.`);
        setCredits(res.data.creditsRemaining);
      } else {
        toast.success('Property saved as draft!');
      }

      navigate("/listings");
    } catch (err) {
      console.log(err);
      const errorMessage = err.response?.data?.message || "Failed to create post";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="newPostPage">
      {showCreditModal && (
        <div className="modal">
          <div className="modalContent">
            <h2>Insufficient Credits</h2>
            <p>You need at least 1 credit to publish a property listing.</p>
            <p>Your current balance: <strong>{credits} credits</strong></p>
            <div className="modalButtons">
              <Button onClick={() => navigate('/pricing')}>Buy Credits</Button>
              <button onClick={() => setShowCreditModal(false)} className="cancelBtn">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="formContainer">
        <div className="header">
          <h1>Add New Property</h1>
          <div className="creditsDisplay">
            <span className="creditsLabel">Your Credits:</span>
            <span className="creditsValue">{credits}</span>
          </div>
        </div>
        <div className="wrapper">
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="item">
              <label htmlFor="title">Title</label>
              <input id="title" name="title" type="text" />
            </div>
            <div className="item">
              <label htmlFor="price">Price</label>
              <input id="price" name="price" type="number" />
            </div>
            <div className="item">
              <label htmlFor="address">Address</label>
              <input id="address" name="address" type="text" />
            </div>
            <div className="item description">
              <label htmlFor="desc">Description</label>
              <ReactQuill theme="snow" onChange={setValue} value={value} />
            </div>
            <div className="item">
              <label htmlFor="city">City</label>
              <input id="city" name="city" type="text" />
            </div>
            <div className="item">
              <label htmlFor="bedroom">Bedroom Number</label>
              <input min={1} id="bedroom" name="bedroom" type="number" />
            </div>
            <div className="item">
              <label htmlFor="bathroom">Bathroom Number</label>
              <input min={1} id="bathroom" name="bathroom" type="number" />
            </div>
            <div className="item">
              <label htmlFor="latitude">Latitude</label>
              <input id="latitude" name="latitude" type="text" />
            </div>
            <div className="item">
              <label htmlFor="longitude">Longitude</label>
              <input id="longitude" name="longitude" type="text" />
            </div>
            <div className="item">
              <label htmlFor="type">Type</label>
              <select name="type">
                <option value="rent" defaultChecked>
                  Rent
                </option>
                <option value="buy">Buy</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="type">Property</label>
              <select name="property">
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="condo">Condo</option>
                <option value="land">Land</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="utilities">Utilities Policy</label>
              <select name="utilities">
                <option value="owner">Owner is responsible</option>
                <option value="tenant">Tenant is responsible</option>
                <option value="shared">Shared</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="pet">Pet Policy</label>
              <select name="pet">
                <option value="allowed">Allowed</option>
                <option value="not-allowed">Not Allowed</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="income">Income Policy</label>
              <input
                id="income"
                name="income"
                type="text"
                placeholder="Income Policy"
              />
            </div>
            <div className="item">
              <label htmlFor="size">Total Size (sqft)</label>
              <input min={0} id="size" name="size" type="number" />
            </div>
            <div className="item">
              <label htmlFor="school">School</label>
              <input min={0} id="school" name="school" type="number" />
            </div>
            <div className="item">
              <label htmlFor="bus">Bus</label>
              <input min={0} id="bus" name="bus" type="number" />
            </div>
            <div className="item">
              <label htmlFor="restaurant">Restaurant</label>
              <input min={0} id="restaurant" name="restaurant" type="number" />
            </div>

            <div className="submitButtons">
              <button
                type="button"
                className="draftBtn"
                onClick={(e) => handleSubmit(e, false)}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                type="button"
                className="publishBtn"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading || credits < 1}
              >
                {loading ? 'Publishing...' : `Publish (1 Credit)`}
              </button>
            </div>

            {credits < 1 && (
              <div className="creditWarning">
                ⚠️ You need at least 1 credit to publish. <a href="/pricing">Buy credits</a>
              </div>
            )}

            {error && <div className="errorMessage">{error}</div>}
          </form>
        </div>
      </div>
      <div className="sideContainer">
        <div className="imageInfo">
          <h3>Property Images</h3>
          <p>Default placeholder images will be used for your property listing.</p>
          <p className="imageNote">📷 Using: house1.jpg, house2.jpg, house3.jpg</p>
        </div>
        <div className="images">
          {images.map((image, index) => (
            <img src={image} key={index} alt={`property-${index + 1}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default NewPostPage;
