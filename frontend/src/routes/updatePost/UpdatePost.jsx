import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiRequest from "../../lib/apiRequest"; // Assuming this handles API requests
import "./updatePost.scss";
import ReactQuill from "react-quill";
import toast from "react-hot-toast";

import Button from "../../components/ui/button";

function UpdatePost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    address: "",
    city: "",
    bedroom: "",
    bathroom: "",
    type: "buy",
    property: "apartment",
    postDetail: {
      desc: "",
      utilities: "owner",
      petPolicy: "not-allowed",
      income: "",
      size: 0,
      school: 0,
      bus: 0,
      restaurant: 0,
    },
  });

  console.log(formData);

  useEffect(() => {
    async function fetchPost() {
      try {
        const { data } = await apiRequest.get(`/posts/${id}`);
        setFormData({
          title: data.title,
          price: data.price,
          address: data.address,
          city: data.city,
          bedroom: data.bedroom,
          bathroom: data.bathroom,
          type: data.type,
          property: data.property,
          postDetail: {
            desc: data.postDetail?.desc || "",
            utilities: data.postDetail?.utilities || "owner",
            petPolicy: data.postDetail?.petPolicy || "not-allowed",
            income: data.postDetail?.income || "",
            size: data.postDetail?.size || 0,
            school: data.postDetail?.school || 0,
            bus: data.postDetail?.bus || 0,
            restaurant: data.postDetail?.restaurant || 0,
          },
        });
      } catch (err) {
        console.error(err);
        alert("Failed to fetch post details.");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name in formData.postDetail) {
      setFormData((prev) => ({
        ...prev,
        postDetail: {
          ...prev.postDetail,
          [name]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleQuillChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      postDetail: { ...prev.postDetail, desc: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiRequest.put(`/posts/${id}`, { formData });
      toast.success("Post updated successfully!");
      navigate(`/${id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to update the post.");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="updatePostPage">
      <div className="formContainer">
        <h1>Update Post</h1>
        <div className="wrapper">
          <form onSubmit={handleSubmit}>
            <div className="item">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="item">
              <label htmlFor="price">Price</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="item">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>

            <div className="item">
              <label htmlFor="desc">Description</label>
              <ReactQuill
                theme="snow"
                value={formData.postDetail.desc}
                onChange={handleQuillChange}
              />
            </div>


            <div className="item" style={{ paddingTop: "40px" }}>
              <label htmlFor="city">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>

            <div className="column-item">
              <div className="item">
                <label htmlFor="income">Income Policy</label>
                <input
                  type="text"
                  name="income"
                  value={formData.postDetail.income}
                  onChange={handleChange}
                />
              </div>

              <div className="item">
                <label htmlFor="petPolicy">Pet Policy</label>
                <select
                  name="petPolicy"
                  value={formData.postDetail.petPolicy}
                  onChange={handleChange}
                >
                  <option value="allowed">Allowed</option>
                  <option value="not-allowed">Not Allowed</option>
                </select>
              </div>

              <div className="item">
                <label htmlFor="utilities">Utilities Policy</label>
                <select
                  name="utilities"
                  value={formData.postDetail.utilities}
                  onChange={handleChange}
                >
                  <option value="owner">Owner is responsible</option>
                  <option value="tenant">Tenant is responsible</option>
                  <option value="shared">Shared</option>
                </select>
              </div>
            </div>

            <div className="column-item">
              <div className="item">
                <label htmlFor="size">Total Size (sqft)</label>
                <input
                  type="number"
                  name="size"
                  value={formData.postDetail.size}
                  onChange={handleChange}
                />
              </div>

              <div className="item">
                <label htmlFor="bedroom">Bedroom Number</label>
                <input
                  type="number"
                  name="bedroom"
                  value={formData.bedroom}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="item">
                <label htmlFor="bathroom">Bathroom Number</label>
                <input
                  type="number"
                  name="bathroom"
                  value={formData.bathroom}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>


            <div className="column-item">
              <div className="item">
                <label htmlFor="petPolicy">School</label>
                <input
                  type="number"
                  name="school"
                  value={formData.postDetail.school}
                  onChange={handleChange}
                />
              </div>

              <div className="item">
                <label htmlFor="income">Bus Stop</label>
                <input
                  type="text"
                  name="bus"
                  value={formData.postDetail.bus}
                  onChange={handleChange}
                />
              </div>

              <div className="item">
                <label htmlFor="size">Restaurant</label>
                <input
                  type="number"
                  name="restaurant"
                  value={formData.postDetail.restaurant}
                  onChange={handleChange}
                />
              </div>
            </div>

            <Button type="submit">Update Post</Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UpdatePost;