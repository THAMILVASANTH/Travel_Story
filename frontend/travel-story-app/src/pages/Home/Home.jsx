import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { MdAdd } from "react-icons/md";
import Modal from "react-modal";
import TravelStoryCard from "../../components/Cards/TravelStoryCard";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AddEditTravelStory from "./AddEditTravelStory";
import ViewTravelStory from "./ViewTravelStory";
import EmptyCard from "../../components/Cards/EmptyCard";

import { DayPicker } from "react-day-picker";
import moment from "moment";
import "react-day-picker/dist/style.css";
import "../../index.css";
import FilterInfoTitle from "../../components/Cards/FilterInfoTitle";
import { getEmptyCardImg, getEmptyCardMessage } from "../../utils/helper";

const Home = () => {
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState(null);
  const [allStories, setAllStories] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");

  const [dateRange, setDateRange] = useState({ from: null, to: null });

  const [loading, setLoading] = useState(false);
  const [openAddEditModal, setOpenAddEditModal] = useState({
    isShown: false,
    type: "add",
    data: null,
  });

  const [openViewModal, setOpenViewModal] = useState({
    isShown: false,
    data: null,
  });

  // Fetch user information
  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get("/get-user");
      if (response.data && response.data.user) {
        setUserInfo(response.data.user);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate("/login");
      } else {
        toast.error("Failed to fetch user information.");
      }
    }
  };

  // Fetch all travel stories
  const getAllTravelStories = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/get-all-stories");
      if (response.data && response.data.stories) {
        setAllStories(response.data.stories);
      }
    } catch (error) {
      toast.error("Failed to fetch travel stories. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle favorite status
  const updateIsFavourite = async (storyData) => {
    const storyId = storyData._id;
    try {
      const response = await axiosInstance.put(`/update-isFav/${storyId}`, {
        isFavourite: !storyData.isFavourite,
      });
      if (response.data && response.data.story) {
        toast.success("Story updated successfully.");

        if (filterType === "search" && searchQuery) {
          onSearchStory(searchQuery);
        } else if (filterType === "date") {
          filterStoriesByDate(dateRange);
        } else {
          getAllTravelStories();
        }
      }
    } catch (error) {
      toast.error("Failed to update story. Please try again.");
    }
  };

  // Handle edit button click
  const handleEdit = (data) => {
    setOpenAddEditModal({
      isShown: true,
      type: "edit",
      data: data,
    });
  };

  // Handle view story (future implementation)
  const handleViewStory = (data) => {
    setOpenViewModal({ isShown: true, data });
  };

  // Delete travel story
  const deleteTravelStory = async (data) => {
    const storyId = data._id;

    try {
      const response = await axiosInstance.delete("/delete-story/" + storyId);

      if (response.data && !response.data.error) {
        toast.error("Story deleted successfully");
        setOpenViewModal((prevState) => ({ ...prevState, isShown: false }));
        getAllTravelStories();
      }
    } catch (error) {
      console.log("An unexpected error occurred. Please try again.");
    }
  };

  // Search travel story
  const onSearchStory = async (query) => {
    try {
      const response = await axiosInstance.get("/search", {
        params: {
          query,
        },
      });

      if (response.data && response.data.stories) {
        setFilterType("search");
        setAllStories(response.data.stories);
      }
    } catch (error) {
      console.log("An unexpected error occurred. Please try again.");
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setFilterType("");
    getAllTravelStories();
  };

  // Filter stories by date
  const filterStoriesByDate = async (day) => {
    try {
      const startDate = day.from ? moment(day.from).valueOf() : null;
      const endDate = day.to ? moment(day.to).valueOf() : null;

      if (startDate && endDate) {
        const response = await axiosInstance.get("/filter", {
          params: {
            startDate,
            endDate,
          },
        });

        if (response.data && response.data.stories) {
          setFilterType("date");
          setAllStories(response.data.stories);
        }
      }
    } catch (error) {
      console.log("An unexpected error occurred. Please try again.");
    }
  };

  // handle Date range select
  const handleDayClick = (day) => {
    setDateRange(day);
    filterStoriesByDate(day);
  };

  const resetFilter = () => {
    setDateRange({ from: null, to: null });
    setFilterType("");
    getAllTravelStories();
  };

  useEffect(() => {
    getUserInfo();
    getAllTravelStories();
  }, []);

  return (
    <>
      <Navbar
        userInfo={userInfo}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchNote={onSearchStory}
        handleClearSearch={handleClearSearch}
      />

      <div className="container mx-auto p-10">
        <FilterInfoTitle
          filterType={filterType}
          filterDates={dateRange}
          onClear={() => {
            resetFilter();
          }}
        />

        <div className="flex gap-7">
          <div className="flex-1">
            {loading ? (
              <div>Loading stories...</div>
            ) : allStories.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 px-12">
                {allStories.map((item) => (
                  <TravelStoryCard
                    key={item._id}
                    imgUrl={item.imageUrl}
                    title={item.title}
                    story={item.story}
                    date={item.visitedDate}
                    visitedLocation={item.visitedLocation}
                    isFavourite={item.isFavourite}
                    onClick={() => handleViewStory(item)}
                    onFavouriteClick={() => updateIsFavourite(item)}
                  />
                ))}
              </div>
            ) : (
              <EmptyCard
                imgSrc={getEmptyCardImg(filterType)}
                message={getEmptyCardMessage(filterType)}
              />
            )}
          </div>

          <div className="w-[350px]">
            <div className="bg-white border border-slate-200 shadow-lg  shadow-slate-200/60 rounded-lg">
              <div className="p-3">
                <DayPicker
                  captionLayout="dropdown-buttons"
                  mode="range"
                  selected={dateRange}
                  onSelect={handleDayClick}
                  pagedNavigation
                  className="rdp-root"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={openAddEditModal.isShown}
        onRequestClose={() =>
          setOpenAddEditModal({ isShown: false, type: "add", data: null })
        }
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            zIndex: 999,
          },
        }}
        appElement={document.getElementById("root")}
        className="model-box"
      >
        <AddEditTravelStory
          type={openAddEditModal.type}
          storyInfo={openAddEditModal.data}
          onClose={() =>
            setOpenAddEditModal({ isShown: false, type: "add", data: null })
          }
          getAllTravelStories={getAllTravelStories}
        />
      </Modal>

      <Modal
        isOpen={openViewModal.isShown}
        onRequestClose={() =>
          setOpenAddEditModal({ isShown: false, type: "add", data: null })
        }
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            zIndex: 999,
          },
        }}
        appElement={document.getElementById("root")}
        className="model-box"
      >
        <ViewTravelStory
          storyInfo={openViewModal.data || null}
          onClose={() => {
            setOpenViewModal((prevState) => ({ ...prevState, isShown: false }));
          }}
          onEditClick={() => {
            setOpenViewModal((prevState) => ({ ...prevState, isShown: false }));
            handleEdit(openViewModal.data || null);
          }}
          onDeleteClick={() => {
            deleteTravelStory(openViewModal.data || null);
          }}
        />
      </Modal>

      <button
        className="w-16 h-16 flex items-center justify-center rounded-full bg-primary hover:bg-cyan-400 fixed right-10 bottom-10"
        onClick={() =>
          setOpenAddEditModal({ isShown: true, type: "add", data: null })
        }
      >
        <MdAdd className="text-[320px] text-white" />
      </button>

      <ToastContainer />
    </>
  );
};

export default Home;
