import { ClearOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, DatePicker, Input, Space, Tag } from "antd";

const { RangePicker } = DatePicker;

const SearchFilters = ({
  filters,
  onFiltersChange,
  onSearch,
  onClearFilters,
  isMobile = false,
}) => {
  const handleInputChange = (field, value) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const handleDateRangeChange = (dates) => {
    onFiltersChange({
      ...filters,
      dateRange: dates,
    });
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value && value !== ""
  );

  return (
    <div className="search-filters-container">
      <div className="search-filters-row">
        <Space
          direction={isMobile ? "vertical" : "horizontal"}
          size={isMobile ? 8 : 16}
          style={{ width: "100%" }}
          wrap
        >
          <div className="filter-group">
            <label className="filter-label">Từ ngày - Đến ngày:</label>
            <RangePicker
              value={filters.dateRange}
              onChange={handleDateRangeChange}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
              style={{ width: isMobile ? "100%" : 280 }}
              size={isMobile ? "small" : "middle"}
              inputReadOnly
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Số CT:</label>
            <Input
              value={filters.so_ct}
              onChange={(e) => handleInputChange("so_ct", e.target.value)}
              placeholder="Nhập số chứng từ"
              style={{ width: isMobile ? "100%" : 150 }}
              size={isMobile ? "small" : "middle"}
              allowClear
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Mã khách:</label>
            <Input
              value={filters.ma_kh}
              onChange={(e) => handleInputChange("ma_kh", e.target.value)}
              placeholder="Nhập mã khách"
              style={{ width: isMobile ? "100%" : 120 }}
              size={isMobile ? "small" : "middle"}
              allowClear
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Tên khách:</label>
            <Input
              value={filters.ten_kh}
              onChange={(e) => handleInputChange("ten_kh", e.target.value)}
              placeholder="Nhập tên khách"
              style={{ width: isMobile ? "100%" : 180 }}
              size={isMobile ? "small" : "middle"}
              allowClear
            />
          </div>
        </Space>
      </div>

      <div className="search-filters-actions">
        <Space size={8}>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={onSearch}
            size={isMobile ? "small" : "middle"}
          >
            Tìm kiếm
          </Button>

          {hasActiveFilters && (
            <Button
              icon={<ClearOutlined />}
              onClick={onClearFilters}
              size={isMobile ? "small" : "middle"}
            >
              Xóa bộ lọc
            </Button>
          )}
        </Space>
      </div>

      {hasActiveFilters && (
        <div className="active-filters">
          <span className="active-filters-label">Bộ lọc đang áp dụng:</span>
          <Space size={4} wrap>
            {filters.dateRange && filters.dateRange.length === 2 && (
              <Tag
                color="blue"
                closable
                onClose={() => handleInputChange("dateRange", null)}
                size="small"
              >
                Từ: {filters.dateRange[0].format("DD/MM/YYYY")} - Đến:{" "}
                {filters.dateRange[1].format("DD/MM/YYYY")}
              </Tag>
            )}
            {filters.so_ct && (
              <Tag
                color="blue"
                closable
                onClose={() => handleInputChange("so_ct", "")}
                size="small"
              >
                Số CT: {filters.so_ct}
              </Tag>
            )}
            {filters.ma_kh && (
              <Tag
                color="blue"
                closable
                onClose={() => handleInputChange("ma_kh", "")}
                size="small"
              >
                Mã khách: {filters.ma_kh}
              </Tag>
            )}
            {filters.ten_kh && (
              <Tag
                color="blue"
                closable
                onClose={() => handleInputChange("ten_kh", "")}
                size="small"
              >
                Tên khách: {filters.ten_kh}
              </Tag>
            )}
          </Space>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
