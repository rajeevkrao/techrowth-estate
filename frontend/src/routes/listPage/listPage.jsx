import "./listPage.scss";
import Filter from "../../components/filter/Filter"
import Card from "../../components/card/Card"
import Map from "../../components/map/Map";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import apiRequest from "../../lib/apiRequest";

function ListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');

  const currentPage = parseInt(searchParams.get('page')) || 1;

  useEffect(() => {
    fetchPosts();
  }, [searchParams, sortBy, sortOrder]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Build query string from search params
      const params = new URLSearchParams(searchParams);
      params.set('page', currentPage);
      params.set('limit', '10');
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      params.set('status', 'ACTIVE'); // Only show active posts on public list

      const res = await apiRequest.get(`/posts?${params.toString()}`);
      setPosts(res.data.posts || []);
      setPagination(res.data.pagination || {});
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage);
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    const [newSortBy, newSortOrder] = value.split('-');
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);

    const params = new URLSearchParams(searchParams);
    params.set('sortBy', newSortBy);
    params.set('sortOrder', newSortOrder);
    params.set('page', '1'); // Reset to page 1 when sorting changes
    setSearchParams(params);
  };

  return <div className="listPage">
    <div className="listContainer">
      <div className="wrapper">
        <Filter/>

        {/* Sorting and Results Count */}
        <div className="listHeader">
          <div className="resultsInfo">
            {!loading && pagination.total !== undefined && (
              <span>Found {pagination.total} {pagination.total === 1 ? 'property' : 'properties'}</span>
            )}
          </div>
          <div className="sortControl">
            <label htmlFor="sort">Sort by:</label>
            <select
              id="sort"
              value={`${sortBy}-${sortOrder}`}
              onChange={handleSortChange}
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="viewCount-desc">Most Viewed</option>
            </select>
          </div>
        </div>

        {/* Posts List */}
        {loading ? (
          <p className="loading">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="noResults">No properties found. Try adjusting your filters.</p>
        ) : (
          <>
            {posts.map(post => (
              <Card key={post.id} item={post}/>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pageBtn"
                >
                  ← Previous
                </button>

                <div className="pageNumbers">
                  {[...Array(pagination.totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    // Show first, last, current, and adjacent pages
                    if (
                      pageNum === 1 ||
                      pageNum === pagination.totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`pageBtn ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return <span key={pageNum} className="ellipsis">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="pageBtn"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    <div className="mapContainer">
      {!loading && posts.length > 0 && <Map items={posts}/>}
    </div>
  </div>;
}

export default ListPage;