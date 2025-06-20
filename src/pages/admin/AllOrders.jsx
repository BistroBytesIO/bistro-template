import React, { useEffect, useState } from "react";
import adminApi from "../../services/adminApi";
import ClipLoader from "react-spinners/ClipLoader";
import toast from "react-hot-toast";
import {
    Clock,
    CheckCircle,
    AlertCircle,
    Search,
    Filter,
    X,
    ChevronLeft,
    ChevronRight,
    Eye,
    Download,
    Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";

function AllOrders() {
    const [allOrders, setAllOrders] = useState([]); // Store all orders
    const [filteredOrders, setFilteredOrders] = useState([]); // Store filtered orders
    const [displayedOrders, setDisplayedOrders] = useState([]); // Store paginated orders
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [orderIdFilter, setOrderIdFilter] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [statusFilter, setStatusFilter] = useState("COMPLETED"); // Default to completed
    const [showFilters, setShowFilters] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Available order statuses
    const orderStatuses = [
        { value: "ALL", label: "All Statuses" },
        { value: "COMPLETED", label: "Completed" },
        { value: "PENDING", label: "Pending" },
        { value: "READY_FOR_PICKUP", label: "Ready for Pickup" },
        { value: "CANCELED", label: "Canceled" }
    ];

    useEffect(() => {
        fetchAllOrders();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [allOrders, searchTerm, orderIdFilter, startDate, endDate, statusFilter]);

    useEffect(() => {
        updatePagination();
    }, [filteredOrders, currentPage]);

    const fetchAllOrders = async () => {
        setLoading(true);
        try {
            console.log('📊 Fetching all orders...');
            const response = await adminApi.get('/admin/orders');
            console.log("✅ Fetched all orders:", response.data);

            if (response.data && Array.isArray(response.data)) {
                setAllOrders(response.data);
            } else {
                setAllOrders([]);
            }
        } catch (error) {
            console.error("❌ Error fetching all orders:", error);
            setAllOrders([]);
            toast.error("Failed to fetch orders");
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...allOrders];

        // Filter by status
        if (statusFilter !== "ALL") {
            filtered = filtered.filter(order => order.status === statusFilter);
        }

        // Filter by customer name
        if (searchTerm.trim()) {
            filtered = filtered.filter(order =>
                order.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by order ID
        if (orderIdFilter.trim()) {
            const orderId = parseInt(orderIdFilter.trim());
            if (!isNaN(orderId)) {
                filtered = filtered.filter(order => order.id === orderId);
            }
        }

        // Filter by date range
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.orderDate);
                return orderDate >= start;
            });
        }

        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.orderDate);
                return orderDate <= end;
            });
        }

        setFilteredOrders(filtered);
        setCurrentPage(0); // Reset to first page when filters change
    };

    const updatePagination = () => {
        const startIndex = currentPage * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

        setDisplayedOrders(paginatedOrders);
        setTotalElements(filteredOrders.length);
        setTotalPages(Math.ceil(filteredOrders.length / pageSize));
    };

    const handleApplyFilters = (e) => {
        e.preventDefault();
        // Filters are already applied via useEffect, this is just for the button click
        // You could add additional validation here if needed
        toast.success("Filters applied");
    };

    const clearFilters = () => {
        setSearchTerm("");
        setOrderIdFilter("");
        setStartDate("");
        setEndDate("");
        setStatusFilter("COMPLETED");
        setCurrentPage(0);
    };

    const toggleOrderDetails = (orderId) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'READY_FOR_PICKUP':
                return 'bg-blue-100 text-blue-800';
            case 'CANCELED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'COMPLETED':
                return <CheckCircle size={12} className="mr-1" />;
            case 'PENDING':
                return <Clock size={12} className="mr-1" />;
            case 'READY_FOR_PICKUP':
                return <AlertCircle size={12} className="mr-1" />;
            case 'CANCELED':
                return <X size={12} className="mr-1" />;
            default:
                return <Clock size={12} className="mr-1" />;
        }
    };

    const exportToCSV = () => {
        if (filteredOrders.length === 0) {
            toast.error("No orders to export");
            return;
        }

        const csvData = filteredOrders.map(order => ({
            'Order ID': order.id,
            'Date': formatDate(order.orderDate),
            'Customer Name': order.customerName,
            'Customer Email': order.customerEmail,
            'Customer Phone': order.customerPhone || 'N/A',
            'Status': order.status,
            'Payment Status': order.paymentStatus,
            'Subtotal': `$${order.subTotal?.toFixed(2) || '0.00'}`,
            'Tax': `$${order.tax?.toFixed(2) || '0.00'}`,
            'Service Fee': `$${order.serviceFee?.toFixed(2) || '0.00'}`,
            'Total Amount': `$${order.totalAmount?.toFixed(2) || '0.00'}`,
            'Items': order.items?.map(item => `${item.name} (${item.quantity}x)`).join('; ') || 'N/A',
            'Special Notes': order.specialNotes || 'None'
        }));

        const csvContent = [
            Object.keys(csvData[0]).join(','),
            ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${statusFilter.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success(`${filteredOrders.length} orders exported to CSV`);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-center items-center py-12">
                    <ClipLoader color="#3B82F6" size={40} />
                    <span className="ml-3 text-gray-600">Loading orders...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Orders ({totalElements} {statusFilter !== "ALL" ? statusFilter.toLowerCase() : "total"})
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setShowFilters(!showFilters)}
                        variant="outline"
                        size="sm"
                        className="text-gray-600 border-gray-300"
                    >
                        <Filter size={16} className="mr-1" />
                        Filters
                    </Button>

                    <Button
                        onClick={exportToCSV}
                        variant="outline"
                        size="sm"
                        className="text-gray-600 border-gray-300"
                        disabled={filteredOrders.length === 0}
                    >
                        <Download size={16} className="mr-1" />
                        Export CSV
                    </Button>

                    <Button
                        onClick={fetchAllOrders}
                        variant="outline"
                        size="sm"
                        className="text-gray-600 border-gray-300"
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                    <form onSubmit={handleApplyFilters} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {orderStatuses.map(status => (
                                        <option key={status.value} value={status.value}>
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer Name
                                </label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by customer name..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Order ID
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={orderIdFilter}
                                    onChange={(e) => setOrderIdFilter(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder="Enter order ID..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" size="sm">
                                <Search size={16} className="mr-1" />
                                Apply Filters
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={clearFilters}
                            >
                                <X size={16} className="mr-1" />
                                Clear All
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Orders List */}
            {displayedOrders.length > 0 ? (
                <div className="space-y-4">
                    {displayedOrders.map((order) => (
                        <div
                            key={order.id}
                            className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
                        >
                            {/* Order Header - Always Visible */}
                            <div className="bg-gray-50 p-4 border-b">
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 items-center">
                                    <div>
                                        <span className="text-gray-600 text-xs font-medium">ORDER ID</span>
                                        <div className="font-bold text-gray-800">#{order.id}</div>
                                    </div>

                                    <div>
                                        <span className="text-gray-600 text-xs font-medium">CUSTOMER</span>
                                        <div className="font-medium text-gray-800 truncate">{order.customerName}</div>
                                    </div>

                                    <div>
                                        <span className="text-gray-600 text-xs font-medium">DATE</span>
                                        <div className="text-sm text-gray-600">
                                            {formatDate(order.orderDate)}
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-gray-600 text-xs font-medium">TOTAL</span>
                                        <div className="font-semibold text-gray-800">
                                            ${order.totalAmount?.toFixed(2) || '0.00'}
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-gray-600 text-xs font-medium">STATUS</span>
                                        <div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                {order.status.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button
                                            onClick={() => toggleOrderDetails(order.id)}
                                            variant="ghost"
                                            size="sm"
                                            className="text-gray-600 hover:text-gray-800"
                                        >
                                            <Eye size={16} className="mr-1" />
                                            {expandedOrderId === order.id ? 'Hide' : 'View'} Details
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Expandable Order Details */}
                            {expandedOrderId === order.id && (
                                <div className="p-4 bg-white">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Customer Information */}
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-3">Customer Information</h4>
                                            <div className="space-y-2 text-sm">
                                                <div><span className="font-medium">Name:</span> {order.customerName}</div>
                                                <div><span className="font-medium">Email:</span> {order.customerEmail}</div>
                                                {order.customerPhone && (
                                                    <div><span className="font-medium">Phone:</span> {order.customerPhone}</div>
                                                )}
                                                <div><span className="font-medium">Payment Status:</span>
                                                    <span className={`ml-1 px-2 py-1 rounded text-xs ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {order.paymentStatus}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Order Summary */}
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-3">Order Summary</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span>Subtotal:</span>
                                                    <span>${order.subTotal?.toFixed(2) || '0.00'}</span>
                                                </div>
                                                {order.tax > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>Tax:</span>
                                                        <span>${order.tax?.toFixed(2) || '0.00'}</span>
                                                    </div>
                                                )}
                                                {order.serviceFee > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>Service Fee:</span>
                                                        <span>${order.serviceFee?.toFixed(2) || '0.00'}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between font-semibold pt-2 border-t">
                                                    <span>Total:</span>
                                                    <span>${order.totalAmount?.toFixed(2) || '0.00'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div className="mt-6">
                                        <h4 className="font-semibold text-gray-800 mb-3">Order Items</h4>
                                        <div className="bg-gray-50 rounded p-3 max-h-48 overflow-y-auto">
                                            {order.items && order.items.length > 0 ? (
                                                <div className="space-y-2">
                                                    {order.items.map((item, index) => (
                                                        <div key={index} className="flex justify-between items-start bg-white p-2 rounded">
                                                            <div className="flex-1">
                                                                <div className="font-medium">{item.name}</div>
                                                                <div className="text-sm text-gray-600">Quantity: {item.quantity}</div>
                                                                {item.customizations && item.customizations.length > 0 && (
                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                        Customizations: {item.customizations.map(c => c.name).join(', ')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-medium">${item.price?.toFixed(2) || '0.00'}</div>
                                                                {item.customizations && item.customizations.length > 0 && (
                                                                    <div className="text-xs text-gray-500">
                                                                        +${item.customizations.reduce((sum, c) => sum + (c.price || 0), 0).toFixed(2)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 text-sm">No items found</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Special Notes */}
                                    {order.specialNotes && (
                                        <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded p-3 text-sm">
                                            <p className="font-medium flex items-center text-yellow-800">
                                                <AlertCircle size={14} className="mr-1" />
                                                Special Notes:
                                            </p>
                                            <p className="text-gray-700 mt-1">{order.specialNotes}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-12 text-center bg-gray-50 rounded-lg">
                    <p className="text-gray-500">
                        {searchTerm || orderIdFilter || startDate || endDate || statusFilter !== "ALL"
                            ? "No orders found matching your filters."
                            : "No orders found."}
                    </p>
                    {(searchTerm || orderIdFilter || startDate || endDate || statusFilter !== "ALL") && (
                        <Button
                            onClick={clearFilters}
                            variant="outline"
                            size="sm"
                            className="mt-2"
                        >
                            Clear Filters
                        </Button>
                    )}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t pt-4">
                    <div className="text-sm text-gray-500">
                        Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} orders
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 0}
                            variant="outline"
                            size="sm"
                        >
                            <ChevronLeft size={16} className="mr-1" />
                            Previous
                        </Button>

                        <span className="px-3 py-1 text-sm bg-gray-100 rounded">
                            Page {currentPage + 1} of {totalPages}
                        </span>

                        <Button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage >= totalPages - 1}
                            variant="outline"
                            size="sm"
                        >
                            Next
                            <ChevronRight size={16} className="ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AllOrders;