import React, { useEffect, useState } from "react";
import DesktopLayout from "./DesktopLayout";
import MobileLayout from "./MobileLayout";
import "./ListTemplate.css";

const ListTemplate = (props) => {
    const {
        title,
        columns,
        data,
        loading,
        onBack,
        onAdd,
        onRefresh,
        rowKey = "stt_rec",
        pagination,
        
        // Selection
        selectedRowKeys,
        setSelectedRowKeys,
        setSelectedRowsData,
        
        // Actions
        desktopActions,
        mobileActions,
        
        // Filters
        activeChips,
        onRemoveFilter,
        onClearAllFilters,
        mobileFilterForm,
        
        // Mobile Specific
        renderMobileItem,
        
        // Table props
        tableProps,
    } = props;

    const [screenSize, setScreenSize] = useState("desktop");

    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            if (width < 480) setScreenSize("mobile");
            else if (width < 768) setScreenSize("mobileLandscape");
            else if (width < 1024) setScreenSize("tablet");
            else setScreenSize("desktop");
        };
        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    const isMobile = screenSize === "mobile";

    return (
        <div className={`list-template-wrapper ${isMobile ? "is-mobile" : "is-desktop"}`}>
            {isMobile ? (
                <MobileLayout 
                    title={title}
                    columns={columns}
                    data={data}
                    loading={loading}
                    onBack={onBack}
                    onAdd={onAdd}
                    onRefresh={onRefresh}
                    renderMobileItem={renderMobileItem}
                    pagination={pagination}
                    selectedRowKeys={selectedRowKeys}
                    setSelectedRowKeys={setSelectedRowKeys}
                    setSelectedRowsData={setSelectedRowsData}
                    mobileActions={mobileActions}
                    mobileFilterForm={mobileFilterForm}
                    onClearAllFilters={onClearAllFilters}
                    rowKey={rowKey}
                    tableProps={tableProps}
                />
            ) : (
                <DesktopLayout 
                    title={title}
                    columns={columns}
                    data={data}
                    loading={loading}
                    onBack={onBack}
                    onAdd={onAdd}
                    onRefresh={onRefresh}
                    rowKey={rowKey}
                    selectedRowKeys={selectedRowKeys}
                    setSelectedRowKeys={setSelectedRowKeys}
                    setSelectedRowsData={setSelectedRowsData}
                    desktopActions={desktopActions}
                    activeChips={activeChips}
                    onRemoveFilter={onRemoveFilter}
                    onClearAllFilters={onClearAllFilters}
                    pagination={pagination}
                    tableProps={tableProps}
                />
            )}
        </div>
    );
};

export default ListTemplate;
