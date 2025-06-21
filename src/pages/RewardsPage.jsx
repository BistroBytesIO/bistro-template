// File: src/pages/RewardsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import api from '../services/api';
import { Gift, Star, Clock, Trophy, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const RewardsPage = () => {
    const { isAuthenticated, rewardsStatus, refreshRewardsStatus } = useAuth();
    const [rewardItems, setRewardItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRedeeming, setIsRedeeming] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            fetchRewardItems();
        }
    }, [isAuthenticated]);

    const fetchRewardItems = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/menu/reward-items');
            setRewardItems(response.data);
        } catch (error) {
            console.error('Error fetching reward items:', error);
            toast.error('Failed to load reward items');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRedeem = async (itemId, pointsNeeded) => {
        if (!rewardsStatus || rewardsStatus.availablePoints < pointsNeeded) {
            toast.error('Insufficient points for this reward');
            return;
        }

        setIsRedeeming(true);
        try {
            const response = await api.post(`/rewards/redeem/item/${itemId}`);

            toast.success(
                <div>
                    <div className="font-semibold">Reward redeemed successfully!</div>
                    <div className="text-sm">Code: {response.data.redemptionCode}</div>
                    <div className="text-xs mt-1">Show this code when ordering</div>
                </div>,
                { duration: 8000 }
            );

            // Refresh rewards status
            await refreshRewardsStatus();
        } catch (error) {
            console.error('Error redeeming reward:', error);
            toast.error(error.response?.data?.error || 'Failed to redeem reward');
        } finally {
            setIsRedeeming(false);
        }
    };

    // Calculate next reward milestone
    const getNextMilestone = () => {
        if (!rewardsStatus || !rewardItems.length) return null;

        const availablePoints = rewardsStatus.availablePoints;
        const sortedItems = rewardItems
            .filter(item => item.pointsToRedeem > availablePoints)
            .sort((a, b) => a.pointsToRedeem - b.pointsToRedeem);

        return sortedItems.length > 0 ? sortedItems[0] : null;
    };

    const nextMilestone = getNextMilestone();

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view rewards</h2>
                    <p className="text-gray-600">Create an account to start earning points with every order!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="text-center">
                        <Trophy className="h-16 w-16 mx-auto mb-4" />
                        <h1 className="text-4xl font-bold mb-4">Your Rewards</h1>
                        <p className="text-xl opacity-90">Redeem your points for delicious rewards!</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Points Summary */}
                {rewardsStatus && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600 mb-2">
                                    {rewardsStatus.availablePoints}
                                </div>
                                <div className="text-gray-600">Available Points</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600 mb-2">
                                    ${rewardsStatus.dollarValue?.toFixed(2) || '0.00'}
                                </div>
                                <div className="text-gray-600">Dollar Value</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600 mb-2">
                                    {rewardsStatus.pointsPerDollar}x
                                </div>
                                <div className="text-gray-600">Points per $1</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress Bar */}
                {nextMilestone && rewardsStatus && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Progress to Next Reward</h2>
                            <div className="flex items-center text-sm text-gray-600">
                                <Zap className="h-4 w-4 mr-1" />
                                {nextMilestone.name}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>{rewardsStatus.availablePoints} points</span>
                                <span>{nextMilestone.pointsToRedeem} points needed</span>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${Math.min(
                                            (rewardsStatus.availablePoints / nextMilestone.pointsToRedeem) * 100,
                                            100
                                        )}%`
                                    }}
                                ></div>
                            </div>

                            <div className="text-center mt-2 text-sm text-gray-600">
                                {nextMilestone.pointsToRedeem - rewardsStatus.availablePoints} more points to unlock{' '}
                                <span className="font-semibold">{nextMilestone.name}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reward Items Grid */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Rewards</h2>

                    {isLoading ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                                    <div className="bg-gray-300 h-4 rounded mb-2"></div>
                                    <div className="bg-gray-300 h-4 rounded w-3/4 mb-4"></div>
                                    <div className="bg-gray-300 h-10 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : rewardItems.length === 0 ? (
                        <div className="text-center py-12">
                            <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No rewards available</h3>
                            <p className="text-gray-600">Check back soon for new reward items!</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {rewardItems.map((item) => {
                                const canRedeem = rewardsStatus && rewardsStatus.availablePoints >= item.pointsToRedeem;

                                return (
                                    <div
                                        key={item.id}
                                        className={`rounded-lg overflow-hidden transition-all duration-200 ${canRedeem
                                                ? 'bg-white border-2 border-green-200 shadow-lg hover:shadow-xl hover:-translate-y-1'
                                                : 'bg-gray-50 border-2 border-gray-200'
                                            }`}
                                    >
                                        <div className="relative">
                                            <img
                                                className="w-full h-48 object-cover"
                                                src={item.imageUrl || "/images/placeholder.png"}
                                                alt={item.name}
                                                onError={(e) => (e.target.src = "/images/placeholder.png")}
                                            />

                                            {/* Points Badge */}
                                            <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-bold ${canRedeem ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                                                }`}>
                                                {item.pointsToRedeem} pts
                                            </div>

                                            {canRedeem && (
                                                <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                                    Available!
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {item.name}
                                                </h3>
                                                <div className="flex items-center text-yellow-500">
                                                    <Star className="fill-yellow-400 h-4 w-4" />
                                                    <span className="ml-1 text-sm font-medium">
                                                        {(4 + (item.id % 10) / 10).toFixed(1)}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                {item.description}
                                            </p>

                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-lg font-bold text-green-600">
                                                    {item.pointsToRedeem} Points
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    (${parseFloat(item.price).toFixed(2)} value)
                                                </span>
                                            </div>

                                            <Button
                                                onClick={() => handleRedeem(item.id, item.pointsToRedeem)}
                                                disabled={!canRedeem || isRedeeming}
                                                className={`w-full font-semibold ${canRedeem
                                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    }`}
                                            >
                                                {isRedeeming ? (
                                                    <div className="flex items-center justify-center">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                        Redeeming...
                                                    </div>
                                                ) : canRedeem ? (
                                                    'Redeem Now'
                                                ) : (
                                                    `Need ${item.pointsToRedeem - (rewardsStatus?.availablePoints || 0)} more points`
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                {rewardsStatus?.recentTransactions && rewardsStatus.recentTransactions.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mt-8">
                        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                        <div className="space-y-3">
                            {rewardsStatus.recentTransactions.slice(0, 5).map((transaction) => (
                                <div key={transaction.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                    <div>
                                        <div className="font-medium text-gray-900">{transaction.description}</div>
                                        <div className="text-sm text-gray-500">
                                            {new Date(transaction.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className={`font-semibold ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {transaction.points > 0 ? '+' : ''}{transaction.points} pts
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RewardsPage;