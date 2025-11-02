import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import apiRequest from "../../lib/apiRequest";
import toast from "react-hot-toast";

import Button from "../../components/ui/button";

import "./listings.scss";

export default function Listings() {
    const [activeTab, setActiveTab] = useState('ACTIVE');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [credits, setCredits] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPosts();
        fetchCredits();
    }, [activeTab]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const res = await apiRequest.get(`/posts?status=${activeTab}`);
            const allPosts = res.data.posts || [];

            // Filter to only show current user's posts
            const userPosts = allPosts.filter(post => post.userId === JSON.parse(localStorage.getItem('user')).id);
            setPosts(userPosts);
        } catch (error) {
            console.error('Error fetching posts:', error);
            toast.error('Failed to load properties');
        } finally {
            setLoading(false);
        }
    };

    const fetchCredits = async () => {
        try {
            const res = await apiRequest.get('/users/credits');
            setCredits(res.data.credits);
        } catch (error) {
            console.error('Error fetching credits:', error);
        }
    };

    const handlePublish = async (postId) => {
        if (credits < 1) {
            toast.error('Insufficient credits!');
            return;
        }

        try {
            const res = await apiRequest.put(`/posts/${postId}/publish`);
            toast.success(res.data.message);
            setCredits(res.data.creditsRemaining);
            fetchPosts();
        } catch (error) {
            console.error('Error publishing post:', error);
            toast.error(error.response?.data?.message || 'Failed to publish property');
        }
    };

    const handleRenew = async (postId) => {
        if (credits < 1) {
            toast.error('Insufficient credits!');
            return;
        }

        try {
            const res = await apiRequest.put(`/posts/${postId}/renew`);
            toast.success(res.data.message);
            setCredits(res.data.creditsRemaining);
            fetchPosts();
        } catch (error) {
            console.error('Error renewing post:', error);
            toast.error(error.response?.data?.message || 'Failed to renew property');
        }
    };

    const handleDelete = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this property?')) {
            return;
        }

        try {
            const res = await apiRequest.delete(`/posts/${postId}`);
            toast.success(res.data.message);
            if (res.data.refunded) {
                toast.success('1 credit has been refunded');
                setCredits(credits + 1);
            }
            fetchPosts();
        } catch (error) {
            console.error('Error deleting post:', error);
            toast.error('Failed to delete property');
        }
    };

    const getExpirationStatus = (expiresAt) => {
        if (!expiresAt) return null;
        const daysLeft = Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 0) return 'Expired';
        if (daysLeft <= 7) return `Expires in ${daysLeft} days`;
        return `${daysLeft} days left`;
    };

    return (
        <div className="listingsPage">
            <div className="header">
                <h1>My Properties</h1>
                <div className="actions">
                    <div className="creditsDisplay">
                        <span>Credits: <strong>{credits}</strong></span>
                    </div>
                    <Button to="/add">Add New Property</Button>
                </div>
            </div>

            <div className="tabs">
                <button
                    className={activeTab === 'ACTIVE' ? 'active' : ''}
                    onClick={() => setActiveTab('ACTIVE')}
                >
                    Active
                </button>
                <button
                    className={activeTab === 'DRAFT' ? 'active' : ''}
                    onClick={() => setActiveTab('DRAFT')}
                >
                    Drafts
                </button>
                <button
                    className={activeTab === 'EXPIRED' ? 'active' : ''}
                    onClick={() => setActiveTab('EXPIRED')}
                >
                    Expired
                </button>
                <button
                    className={activeTab === 'SOLD' ? 'active' : ''}
                    onClick={() => setActiveTab('SOLD')}
                >
                    Sold/Rented
                </button>
            </div>

            <div className="listings">
                {loading ? (
                    <p>Loading...</p>
                ) : posts.length === 0 ? (
                    <div className="emptyState">
                        <p>No {activeTab.toLowerCase()} properties found.</p>
                        {activeTab === 'DRAFT' && (
                            <Button to="/add">Create Your First Property</Button>
                        )}
                    </div>
                ) : (
                    <div className="postGrid">
                        {posts.map(post => (
                            <div key={post.id} className="postCard">
                                <div className="imageContainer">
                                    <img src={post.images[0] || '/noimage.jpg'} alt={post.title} />
                                    {post.isFeatured && <span className="badge featured">Featured</span>}
                                    {post.status === 'EXPIRED' && <span className="badge expired">Expired</span>}
                                </div>
                                <div className="details">
                                    <h3>{post.title}</h3>
                                    <p className="address">📍 {post.address}, {post.city}</p>
                                    <p className="price">₹{post.price.toLocaleString()}</p>
                                    <div className="stats">
                                        <span>🛏️ {post.bedroom} beds</span>
                                        <span>🚿 {post.bathroom} baths</span>
                                        <span>👁️ {post.viewCount} views</span>
                                    </div>
                                    {post.expiresAt && activeTab === 'ACTIVE' && (
                                        <p className="expiration">{getExpirationStatus(post.expiresAt)}</p>
                                    )}
                                </div>
                                <div className="actions">
                                    {activeTab === 'DRAFT' && (
                                        <button
                                            onClick={() => handlePublish(post.id)}
                                            className="publishBtn"
                                            disabled={credits < 1}
                                        >
                                            Publish (1 Credit)
                                        </button>
                                    )}
                                    {activeTab === 'EXPIRED' && (
                                        <button
                                            onClick={() => handleRenew(post.id)}
                                            className="renewBtn"
                                            disabled={credits < 1}
                                        >
                                            Renew (1 Credit)
                                        </button>
                                    )}
                                    <button onClick={() => navigate(`/${post.id}`)} className="viewBtn">
                                        View
                                    </button>
                                    <button onClick={() => navigate(`/update/${post.id}`)} className="editBtn">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(post.id)} className="deleteBtn">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}