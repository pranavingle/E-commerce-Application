import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

const CATEGORIES = ['Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Sports', 'Beauty', 'Toys', 'Grocery'];
const SORT_OPTIONS = [
  { value: '', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const page = Number(searchParams.get('page') || 1);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getProducts({ keyword, category, sort, minPrice, maxPrice, page, limit: 12 });
      setProducts(data.products);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, category, sort, minPrice, maxPrice, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateParam = (key, value) => {
    const params = Object.fromEntries(searchParams.entries());
    if (value) { params[key] = value; } else { delete params[key]; }
    params.page = '1';
    setSearchParams(params);
  };

  return (
    <div className="container py-4">
      <div className="row g-4">
        {/* Sidebar Filters */}
        <div className="col-lg-3">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-body">
              <h5 className="fw-bold mb-3">Filters</h5>

              <div className="mb-4">
                <h6 className="fw-semibold mb-2">Category</h6>
                <div className="d-flex flex-column gap-1">
                  <button
                    className={`btn btn-sm text-start ${!category ? 'btn-danger' : 'btn-outline-secondary'}`}
                    onClick={() => updateParam('category', '')}
                    style={{ borderRadius: 8 }}
                  >
                    All Categories
                  </button>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      className={`btn btn-sm text-start ${category === cat ? 'btn-danger' : 'btn-outline-secondary'}`}
                      onClick={() => updateParam('category', cat)}
                      style={{ borderRadius: 8 }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h6 className="fw-semibold mb-2">Price Range</h6>
                <div className="d-flex gap-2">
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="Min ₹"
                    defaultValue={minPrice}
                    onBlur={(e) => updateParam('minPrice', e.target.value)}
                    style={{ borderRadius: 8 }}
                  />
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="Max ₹"
                    defaultValue={maxPrice}
                    onBlur={(e) => updateParam('maxPrice', e.target.value)}
                    style={{ borderRadius: 8 }}
                  />
                </div>
              </div>

              <div>
                <h6 className="fw-semibold mb-2">Sort By</h6>
                <select
                  className="form-select form-select-sm"
                  value={sort}
                  onChange={(e) => updateParam('sort', e.target.value)}
                  style={{ borderRadius: 8 }}
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="col-lg-9">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold mb-0">
                {keyword ? `Results for "${keyword}"` : category || 'All Products'}
              </h5>
              <small className="text-muted">{total} products found</small>
            </div>
          </div>

          {loading ? (
            <Loader />
          ) : products.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: '4rem' }}>🔍</div>
              <h5 className="mt-3">No products found</h5>
              <p className="text-muted">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="row g-3">
                {products.map(product => (
                  <div key={product._id} className="col-6 col-md-4">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <nav className="mt-4 d-flex justify-content-center shopez-pagination">
                  <ul className="pagination">
                    {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                      <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => updateParam('page', String(p))}
                        >
                          {p}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
