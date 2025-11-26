import React, { useState, useEffect } from "react";
import { usersApi, User } from "../api/users";

const MyInfo: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: ""
    });

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            setLoading(true);
            setError(null);
            const userData = await usersApi.getMe();
            setUser(userData);
            setFormData({
                name: userData.name || "",
                email: userData.email || "",
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load user data");
            console.error("Error loading user data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setError(null);
            
            // Update profile
            const updatedUser = await usersApi.updateProfile({
                name: formData.name,
                email: formData.email,
            });
            setUser(updatedUser);

            setEditing(false);
            await loadUserData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update profile");
            console.error("Error updating profile:", err);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#009245]"></div>
                    <p className="mt-4 text-slate-600">Loading your information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">My Information</h2>
                {!editing && (
                    <button
                        onClick={() => setEditing(true)}
                        className="px-4 py-2 bg-[#009245] text-white rounded-lg hover:bg-[#056733] transition-colors"
                    >
                        Edit Profile
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {editing ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#009245] focus:border-[#009245]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#009245] focus:border-[#009245]"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-[#009245] text-white rounded-lg hover:bg-[#056733] transition-colors"
                        >
                            Save Changes
                        </button>
                        <button
                            onClick={() => {
                                setEditing(false);
                                if (user) {
                                    setFormData({
                                        name: user.name || "",
                                        email: user.email || "",
                                    });
                                }
                            }}
                            className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-500 mb-1">
                            Name
                        </label>
                        <p className="text-lg text-slate-800">{user?.name || "N/A"}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-500 mb-1">
                            Email
                        </label>
                        <p className="text-lg text-slate-800">{user?.email || "N/A"}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-500 mb-1">
                            Role
                        </label>
                        <p className="text-lg text-slate-800 capitalize">
                            {user?.role || "user"}
                        </p>
                    </div>

                    {user?.preferences && (
                        <>
                            {user.preferences.location && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 mb-1">
                                        Location
                                    </label>
                                    <p className="text-lg text-slate-800">
                                        {user.preferences.location}
                                    </p>
                                </div>
                            )}

                            {user.preferences.preferredCategory && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 mb-1">
                                        Preferred Category
                                    </label>
                                    <p className="text-lg text-slate-800">
                                        {user.preferences.preferredCategory}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default MyInfo;

