 
import React, { useEffect, useState, useRef } from 'react'
import { Link, useSearchParams, useLocation } from "react-router-dom"
import Profiles from "../../templates/ImagesLoader"
import api from '../../../utils/api'
import { imageUrl } from '../../../utils/imageUrl';
// import axios from 'axios'
import jsonArr from '../../templates/data/jsonData'
 
import { 
  fetchUserDetails, 
  // fetchUserGallery 
} from '../../../services/userService';

import {
  getAllUsers,
  searchUsers,
  // getPublicProfile,
  // getPublicGallery
} from '../../../services/listingService';
const Listing = () => {
  const [userDetails, setUserDetails] = useState({});
  const [userList, setUserList] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const LIMIT = 10;
  const USERGENDER = localStorage.getItem("userGender");
  const userId = localStorage.getItem("userId");
  // At the top of Listing component
const [searchSalaryNum, setSearchSalaryNum] = useState("");
const [searchSalaryUnits, setSearchSalaryUnits] = useState("Lakhs");
const [searchSalaryMessage, setSearchSalaryMessage] = useState("");
useEffect(() => {
  // Check if localStorage keys exist, if not set them by default facing issue of male in new systems
  if (!localStorage.getItem("userGender")) {
    localStorage.setItem("userGender", ""); // empty means no filter
  }
  if (!localStorage.getItem("userId")) {
    localStorage.setItem("userId", ""); // empty means no login
  }
}, []);

  // Get page from URL, default to 1
  const page = Number(searchParams.get('page')) || 1;
  const handleSearchSalaryNumChange = (event) => {
  const value = event.target.value;
  if (/^\d*\.?\d*$/.test(value)) {  // Only numbers
    setSearchSalaryNum(value);
    updateSearchSalaryMessage(value, searchSalaryUnits);
  }
};

const handleSearchSalaryUnitsChange = (event) => {
  const value = event.target.value;
  setSearchSalaryUnits(value);
  updateSearchSalaryMessage(searchSalaryNum, value);
};

const updateSearchSalaryMessage = (num, units) => {
  if (num && units) {
    setSearchSalaryMessage(`Searching for: ${num} ${units} per Annum`);
  } else {
    setSearchSalaryMessage("");
  }
};
  // Get search filters from URL
  const getSearchFiltersFromUrl = () => {
    const filters = {}; 
    // const gender = searchParams.get('gender');
     const gender = (USERGENDER!=="")?(USERGENDER==="Male" ? "Female" : "Male"):searchParams.get('gender');
    const ageFrom = searchParams.get('ageFrom');
    const ageTo = searchParams.get('ageTo');
    const maritalStatus = searchParams.get('maritalStatus');
    const heightFrom = searchParams.get('heightFrom');
    const caste = searchParams.get('caste');
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const education = searchParams.get('education');
    const annualIncome = searchParams.get('annualIncome');
    const occupation = searchParams.get('occupation');
    const workingLocation = searchParams.get('workingLocation');
    
    if (gender) filters.gender = gender;
    if (ageFrom) filters.ageFrom = ageFrom;
    if (ageTo) filters.ageTo = ageTo;
    if (maritalStatus) filters.maritalStatus = maritalStatus;
    if (heightFrom) filters.heightFrom = heightFrom;
    if (caste) filters.caste = caste;
    if (state) filters.state = state;
    if (city) filters.city = city;
    if (education) filters.education = education;
    // if (annualIncome) filters.annualIncome = annualIncome;
 if (annualIncome) filters.annualIncome = annualIncome; 
 if (occupation) filters.occupation = occupation; 
 if (workingLocation) filters.workingLocation = workingLocation; 
    return filters;
  };

  const searchFilters = getSearchFiltersFromUrl();
  const isSearchActive = Object.keys(searchFilters).length > 0;

  // Helper to update page in URL while preserving search filters
  const updatePageInUrl = (newPage) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    setSearchParams(params);
  };

  // Helper to update search filters in URL
  const updateSearchInUrl = (filters) => {
    const params = new URLSearchParams();
    params.set('page', '1'); // Reset to page 1 on new search
    
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== '' && filters[key] !== '0') {
        params.set(key, filters[key]);
      }
    });
    console.log("data added", params.get('ageFrom'), params.get('ageTo'), params.get('gender'),params.get('maritalStatus'),params.get('caste'),params.get('state'),params.get('city'),params.get('heightFrom'),params.get('education'),
    params.get('annualIncome'), params.get('occupation'), params.get('workingLocation')
  );
    setSearchParams(params);
  };

  // Fetch user details once on mount
  useEffect(() => {
    console.log("userId in listing", localStorage.getItem("userGender"))
    if (userId) {
      // api.post('/FetchUserDetails', { uid: userId })
       fetchUserDetails(userId)  // ✅ Using service function
        .then(res => setUserDetails(res.data))
        .catch(err => console.error('Error fetching user details:', err));
    }
  }, [userId]);

  // Fetch initial paginated list (when NOT searching)
  useEffect(() => {
    const fetchInitialUsers = async () => {
      try {
        // Determine opposite gender if user is logged in
        let genderParam = null;
        if (userId) {
          if (USERGENDER) {
            const g = String(USERGENDER).trim().toLowerCase();
            if (g === 'male') genderParam = 'Female';
            else if (g === 'female') genderParam = 'Male';
          } else if (userDetails.ugender) {
            genderParam = userDetails.ugender === 'Male' ? 'Female' : 'Male';
          }
        }

        const genderQuery = genderParam ? `&gender=${encodeURIComponent(genderParam)}` : '';
        // const res = await api.get(`/getAllUsers?page=${page}&limit=${LIMIT}${genderQuery}`);
            const res = await getAllUsers(page, LIMIT, genderParam);
        let rows = Array.isArray(res.data) ? res.data : (res.data.data || res.data.rows || []);
        const total = res.data.total || res.data.totalCount || res.data.count || res.data.totalRecords || rows.length;

        setTotalRecords(total);
        setTotalPages(Math.ceil(total / LIMIT));

       

//         setUserList(updatedUsers);
   // ✅ Profile images are now included in the API response as profile_image_thumb
        // This eliminates 10 separate API calls per page load!
        const updatedUsers = rows.map(user => ({
          ...user,
          profileImage: user.profile_image_thumb || user.profile_image || Profiles.notfound
        }));

        setUserList(updatedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        setUserList([]);
        setTotalPages(0);
        setTotalRecords(0);
      }
    };

    // Only fetch initial users when NOT searching
    if (!isSearchActive && (!userId || (userId && userDetails.ugender) || USERGENDER)) {
      fetchInitialUsers();
    }
  }, [page, userId, userDetails.ugender, isSearchActive, USERGENDER]);

  // Handle search functionality
  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        const body = { ...searchFilters, page, limit: LIMIT };

        const resp = await searchUsers(searchFilters, page, LIMIT);
        const payload = resp.data || {};
        const rows = Array.isArray(payload) ? payload : (payload.data || payload.rows || []);
        const total = payload.total != null ? Number(payload.total) : rows.length;

        setTotalRecords(total);
        setTotalPages(Math.ceil(total / LIMIT));

           const updatedUsers = rows.map(user => ({
          ...user,
          profileImage: user.profile_image_thumb || user.profile_image || Profiles.notfound
        }));

        setUserList(updatedUsers);
      } catch (error) {
        setUserList([]);
        setTotalPages(0);
        setTotalRecords(0);
        console.error('Error fetching search results:', error);
      }
    };

    if (isSearchActive) {
      fetchSearchResults();
    }
  }, [searchParams, page, isSearchActive]);

  const renderPageButtons = () => {
    if (!totalPages || totalPages <= 1) return null;
    
    const buttons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // First page
    if (startPage > 1) {
      buttons.push(
        <a 
          href="#0" 
          key={1} 
          className="page-btn" 
          onClick={(e) => { e.preventDefault(); updatePageInUrl(1); }}
        >
          1
        </a>
      );
      if (startPage > 2) {
        buttons.push(<span key="dots1" className="page-dots">...</span>);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <a 
          href="#0" 
          key={i} 
          className={`page-btn ${i === page ? 'active' : ''}`} 
          onClick={(e) => { e.preventDefault(); updatePageInUrl(i); }}
        >
          {i}
        </a>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="dots2" className="page-dots">...</span>);
      }
      buttons.push(
        <a 
          href="#0" 
          key={totalPages} 
          className="page-btn" 
          onClick={(e) => { e.preventDefault(); updatePageInUrl(totalPages); }}
        >
          {totalPages}
        </a>
      );
    }

    return buttons;
  };

  const basicSearchHandler = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const dataObj = Object.fromEntries(fd.entries());

    // Remove empty values
    Object.keys(dataObj).forEach(key => {
      if (dataObj[key] === '' || dataObj[key] === '0') {
        delete dataObj[key];
      }
    });

    // If user is logged in, automatically set gender to opposite
    if (userId && userDetails.ugender) {
      const oppositeGender = userDetails.ugender === "Male" ? "Female" : "Male";
      dataObj.gender = oppositeGender;
    }
// ✅ NEW: Add salary package if both fields are filled
  if (searchSalaryNum && searchSalaryUnits) {
    dataObj.annualIncome = `${searchSalaryNum} ${searchSalaryUnits}`;
  }

    // Update URL with search filters
    updateSearchInUrl(dataObj);
  };

  const clearSearch = () => {
    // Clear all search params, keep only page=1
    setSearchParams({ page: '1' });
     // Clear salary fields
  setSearchSalaryNum("");
  setSearchSalaryUnits("Lakhs");
  setSearchSalaryMessage("");
  };

  const calculateStartEnd = () => {
    const start = (page - 1) * LIMIT + 1;
    const end = Math.min(page * LIMIT, totalRecords);
    return { start, end };
  };

  const { start, end } = calculateStartEnd();
const location = useLocation();

// Restore scroll position when returning from ProfileDetails
// useEffect(() => {
//   const savedScroll = sessionStorage.getItem('listingScrollY');
//   const savedPage   = sessionStorage.getItem('listingScrollPage');

//   // Only restore if we're on the same page number the user was on
//   if (savedScroll && savedPage && Number(savedPage) === page) {
//     // Wait for list to render, then scroll
//     const timer = setTimeout(() => {
//       window.scrollTo({ top: Number(savedScroll), behavior: 'instant' });
//     }, 100);
//     return () => clearTimeout(timer);
//   }
// }, [userList]); // fires after userList is populated

// // Clear saved scroll whenever page number changes (user navigated to new page)
// useEffect(() => {
//   sessionStorage.removeItem('listingScrollY');
//   sessionStorage.removeItem('listingScrollPage');
// }, [page]);
const scrollRestoredRef = useRef(false);

// Restore scroll AFTER images finish loading
useEffect(() => {
  const savedScroll = sessionStorage.getItem('listingScrollY');
  const savedPage = sessionStorage.getItem('listingScrollPage');

  if (!savedScroll || !savedPage || Number(savedPage) !== page) return;
  if (scrollRestoredRef.current) return; // already restored, don't repeat

  const images = document.querySelectorAll('.listing img');
  
  if (images.length === 0) return;

  let loadedCount = 0;
  const totalImages = images.length;

  const tryRestore = () => {
    loadedCount++;
    if (loadedCount >= totalImages) {
      // All images loaded — now scroll
      scrollRestoredRef.current = true;
      sessionStorage.removeItem('listingScrollY');
      sessionStorage.removeItem('listingScrollPage');
      window.scrollTo({ top: Number(savedScroll), behavior: 'instant' });
    }
  };

  images.forEach(img => {
    if (img.complete) {
      tryRestore();
    } else {
      img.addEventListener('load', tryRestore, { once: true });
      img.addEventListener('error', tryRestore, { once: true }); // count broken images too
    }
  });

}, [userList]); // fires when list renders

// Reset the ref when page changes (user deliberately navigates to new page)
useEffect(() => {
  scrollRestoredRef.current = false;
  // Only clear sessionStorage if this is a user-initiated page change
  // (not a back-navigation remount). We detect this by checking if
  // the saved page matches current page - if not, it's a new page nav.
  const savedPage = sessionStorage.getItem('listingScrollPage');
  if (savedPage && Number(savedPage) !== page) {
    sessionStorage.removeItem('listingScrollY');
    sessionStorage.removeItem('listingScrollPage');
  }
}, [page]);
  return (
    <>
      <div className="pageSearch">
        <div className="container">
          <div className="searchform">
            <form onSubmit={basicSearchHandler}>
              <div className="row">
                {!userId && (
                  <div className="col-lg-3 col-md-6">
                    <select name="gender" className="form-control" defaultValue={searchFilters.gender || ''}>
                      <option value="">Looking For</option>
                      <option value="Female">Bride (Female)</option>
                      <option value="Male">Groom (Male)</option>
                    </select>
                  </div>
                )}
                <div className="col-lg-2 col-md-3">
                  <input 
                    name='ageFrom' 
                    type="number" 
                    className="form-control" 
                    placeholder="Age From"
                    defaultValue={searchFilters.ageFrom || ''}
                  />
                </div>
                <div className="col-lg-2 col-md-3">
                  <input 
                    name='ageTo' 
                    type="number" 
                    className="form-control" 
                    placeholder="Age To"
                    defaultValue={searchFilters.ageTo || ''}
                  />
                </div>
                <div className="col-lg-3 col-md-6">
                  <select name="maritalStatus" className="form-control" defaultValue={searchFilters.maritalStatus || ''}>
                    <option value="">Choose one</option>
                   
                    <option value="Single">Never Married</option>
<option value="Widowed">Widowed</option>
<option value="Divorced">Divorced</option>
<option value="Awaiting Divorce">Awaiting Divorce</option>
                  </select>
                </div>
                <div className="col-lg-2 col-md-6">
                  <button type="submit" className="btn">
                    <i className="fas fa-search"></i> Search
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="inner-heading" style={{ backgroundImage: `url(${Profiles.titlebg})` }}>
        <div className="container">
          <h3>Search Result</h3>
        </div>
      </div>

      <div className="inner-content">
        <div className="container-fluid">
          <div className="listing-wrap">
            <div className="row">
              <div className="col-lg-3">
                {/* Sidebar content - keeping it minimal for brevity */}
                <div className="listingLeft">
                  <div className="title">
                    <h1>Quick <span>Search</span></h1>
                  </div>
                    
            <form onSubmit={basicSearchHandler}>
                    {!userId && (
                      <div class="input-group">
                        <label class="input-group-append">Bride/Groom</label>
                        <select name="gender" class="form-control" id="select">
                          <option value="">-- No Preference --</option>
                          <option value="Male">Groom(Boy)</option>
                          <option value="Female" selected="selected">Bride(Girl)</option>
                        </select>
                      </div>
                    )}
                    <div class="input-group">
                      <label class="input-group-append">Age From</label>
                      <select name="ageFrom" class="form-control">
                        <option value="0">From</option>
                        <option value="18" selected="">18</option>
                        <option value="19">19</option>
                        <option value="20">20</option>
                        <option value="21">21</option>
                        <option value="22">22</option>
                        <option value="23">23</option>
                        <option value="24">24</option>
                        <option value="25">25</option>
                        <option value="26">26</option>
                        <option value="27">27</option>
                        <option value="28">28</option>
                        <option value="29">29</option>
                        <option value="30">30</option>
                        <option value="31">31</option>
                        <option value="32">32</option>
                        <option value="33">33</option>
                        <option value="34">34</option>
                        <option value="35">35</option>
                        <option value="36">36</option>
                        <option value="37">37</option>
                        <option value="38">38</option>
                        <option value="39">39</option>
                        <option value="40">40</option>
                        <option value="41">41</option>
                        <option value="42">42</option>
                        <option value="43">43</option>
                        <option value="44">44</option>
                        <option value="45">45</option>
                        <option value="46">46</option>
                        <option value="47">47</option>
                        <option value="48">48</option>
                        <option value="49">49</option>
                        <option value="50">50</option>
                        <option value="51">51</option>
                        <option value="52">52</option>
                        <option value="53">53</option>
                        <option value="54">54</option>
                        <option value="55">55</option>
                        <option value="56">56</option>
                        <option value="57">57</option>
                        <option value="58">58</option>
                        <option value="59">59</option>
                        <option value="60">60</option>
                        <option value="61">61</option>
                        <option value="62">62</option>
                        <option value="63">63</option>
                        <option value="64">64</option>
                        <option value="65">65</option>
                        <option value="66">66</option>
                        <option value="67">67</option>
                        <option value="68">68</option>
                        <option value="69">69</option>
                        <option value="70">70</option>
                      </select>
                    </div>
                    <div class="input-group">
                      <label class="input-group-append">Age To</label>
                      <select name="ageTo" class="form-control">
                        <option value="0">To</option>
                        <option value="19">19</option>
                        <option value="20">20</option>
                        <option value="21">21</option>
                        <option value="22">22</option>
                        <option value="23">23</option>
                        <option value="24">24</option>
                        <option value="25">25</option>
                        <option value="26">26</option>
                        <option value="27">27</option>
                        <option value="28" selected="">28</option>
                        <option value="29">29</option>
                        <option value="30">30</option>
                        <option value="31">31</option>
                        <option value="32">32</option>
                        <option value="33">33</option>
                        <option value="34">34</option>
                        <option value="35">35</option>
                        <option value="36">36</option>
                        <option value="37">37</option>
                        <option value="38">38</option>
                        <option value="39">39</option>
                        <option value="40">40</option>
                        <option value="41">41</option>
                        <option value="42">42</option>
                        <option value="43">43</option>
                        <option value="44">44</option>
                        <option value="45">45</option>
                        <option value="46">46</option>
                        <option value="47">47</option>
                        <option value="48">48</option>
                        <option value="49">49</option>
                        <option value="50">50</option>
                        <option value="51">51</option>
                        <option value="52">52</option>
                        <option value="53">53</option>
                        <option value="54">54</option>
                        <option value="55">55</option>
                        <option value="56">56</option>
                        <option value="57">57</option>
                        <option value="58">58</option>
                        <option value="59">59</option>
                        <option value="60">60</option>
                        <option value="61">61</option>
                        <option value="62">62</option>
                        <option value="63">63</option>
                        <option value="64">64</option>
                        <option value="65">65</option>
                        <option value="66">66</option>
                        <option value="67">67</option>
                        <option value="68">68</option>
                        <option value="69">69</option>
                        <option value="70">70</option>
                      </select>
                    </div>
                    <div class="input-group">
                      <label class="input-group-append">Marital Status</label>
                      <select name="maritalStatus" class="form-control" id="maritalstatus">
                        <option value="">-- No Preference --</option>
                          
<option value="Single">Never Married</option>
<option value="Widowed">Widowed</option>
<option value="Divorced">Divorced</option>
<option value="Awaiting Divorce">Awaiting Divorce</option>
                      </select>
                    </div>
                    
                    <div class="input-group">
                      <label class="input-group-append">Height</label>
                      <select name="heightFrom" class="form-control" id="height" >
                         <option value="">-- No Preference --</option>
                        {jsonArr.heightData.map((res, i) => <option key={i} value={res.height}>{res.height}</option>)}
                      </select>
                    </div>
                    <div class="input-group checkbox">
                      <input type="checkbox" name="checkname" id="3dgraphic" />
                      <label for="3dgraphic"></label>
                      Only with pictures X</div>
                    <div class="input-group">
                      <label class="input-group-append">State</label>
                      <select name="state" class="form-control" >
                         <option value="">-- No Preference --</option>
                         {jsonArr.states.map((res, i) => <option key={i} value={res.state}>{res.state}</option>)}
                      </select>
                    </div>
                    <div class="input-group">
                      <label class="input-group-append">City</label>
                      <select name="city" class="form-control" id="city"> 
                         <option value="">-- No Preference --</option>
                        {jsonArr.districtData.map((res, i) => <option key={i} value={res.District}>{res.District}</option>)}
                      </select>
                    </div>
                    <div class="input-group">
                      <label class="input-group-append">Caste</label>
                       <select name="caste" class="form-control" id="caste"> 
                         <option value="">-- No Preference --</option>
                       {jsonArr.casteData.map((res, i) => <option key={i} value={res.caste}>{res.caste}</option>)}
                      </select>
                      
                    </div>
                    <div class="input-group">
                      <label class="input-group-append">Education</label>
                      <select name="education" class="form-control" id="education">
                        <option value="">-- No Preference --</option>
                        <option value="Middle School">Middle School</option>
                        <option value="Intermediates">Intermediates</option>
                        <option value="Bachelors">Bachelors</option>
                        <option value="Masters">Masters</option>
                        <option value="Doctorate">Doctorate</option>
                        <option value="Uneducated">Uneducated</option>
<option value="Diploma">Diploma</option>
<option value="ITI">ITI</option>
<option value="BTech">BTech</option>
<option value="MTech">MTech</option>
<option value="MBBS">MBBS</option>
<option value="BPharm">BPharm</option>
<option value="M.Pharm">M.Pharm</option>
<option value="BSc">BSc</option>
<option value="BSc Nursing">BSc Nursing</option>
<option value="BSc Agriculture">BSc Agriculture</option>
<option value="BA">BA</option>
<option value="BCom">BCom</option>
<option value="MBA">MBA</option>
<option value="B.E.">B.E.</option>
<option value="M.E.">M.E.</option>
<option value="B.Sc">B.Sc</option>
<option value="M.Sc">M.Sc</option>
<option value="BBA">BBA</option>
<option value="BCA">BCA</option>
<option value="MCA">MCA</option>
<option value="B.Arch">B.Arch</option>
<option value="B.Ed">B.Ed</option>
<option value="LLB">LLB</option>
<option value="BAMS">BAMS</option>
<option value="BHMS">BHMS</option>
<option value="BDS">BDS</option>
<option value="M.Ed">M.Ed</option>
<option value="MSW">MSW</option>
<option value="MPT">MPT</option>
<option value="MDS">MDS</option>
<option value="M.Ch">M.Ch</option>
<option value="DM">DM</option>
<option value="M.Sc Nursing">M.Sc Nursing</option>
<option value="M.Sc Agri">M.Sc Agri</option>
<option value="PhD">PhD</option>
<option value="CA">CA</option>
<option value="ICWA">ICWA</option>
<option value="CMA">CMA</option>
<option value="CS">CS</option>
<option value="CFA">CFA</option> 
<option value="Pursuing UG">Pursuing UG</option>
<option value="Pursuing PG">Pursuing PG</option> 
                      </select>
                    </div>
                    <div class="input-group">
                      <label class="input-group-append">Occupation</label>
                      <select name="occupation" class="form-control" id="occupation">
                         <option value="">-- No Preference --</option>
                         {jsonArr.occupationData.map((res, i) => <option key={i} value={res.occupation}>{res.occupation}</option>)}
                        
                      </select>
                    </div>
                    {/* <div class="input-group">
                      <label class="input-group-append">Annual Income X</label>
                      <select name="annualIncome" class="form-control" id="annual_income">
                         <option value="">-- No Preference --</option>
                       {jsonArr.salaryData.map((res, i) => <option key={i} value={res.salary}>{res.salary}</option>)}
                      </select>
                    </div> */}
                    {/* Salary Amount Input */}
<div className="input-group">
  <label className="input-group-append">Salary Amount</label>
  <input 
    type="text" 
    value={searchSalaryNum}
    onChange={handleSearchSalaryNumChange}
    className="form-control" 
    placeholder="e.g., 5 or 10.5" 
  />
</div>

{/* Salary Units Dropdown */}
<div className="input-group">
  <label className="input-group-append">Salary Unit</label>
  <select 
    value={searchSalaryUnits}
    onChange={handleSearchSalaryUnitsChange}
    className="form-control"
  >
    <option value="Thousands">Thousands</option>
    <option value="Lakhs">Lakhs</option>
    <option value="Crores">Crores</option>
  </select>
</div>

{/* Display Message */}
{searchSalaryMessage && (
  <div className="input-group">
    <p style={{ 
      color: "#007bff", 
      fontSize: "13px", 
      margin: "5px 0" 
    }}>
      {searchSalaryMessage}
    </p>
  </div>
)}
                    <div class="input-group">
                      <label class="input-group-append">Working Location X</label>
                      <select name="workingLocation" class="form-control" id="working_location">
                        <option value="">-- No Preference --</option> 

<option value="UK">UK</option>
  <option value="USA">USA</option>
  <option value="Bengaluru">Bengaluru</option>
  <option value="Hyderabad">Hyderabad</option> 
  <option value="Ahmedabad">Ahmedabad</option>
<option value="Bhopal">Bhopal</option>
<option value="Bhubaneswar">Bhubaneswar</option>
<option value="Chandigarh">Chandigarh</option>
<option value="Chennai">Chennai</option>
<option value="Coimbatore">Coimbatore</option>
<option value="Dehradun">Dehradun</option>
<option value="Delhi-NCR">Delhi-NCR (incl. Gurugram, Noida)</option>
<option value="Goa">Goa</option>
<option value="Guwahati">Guwahati</option>
<option value="Indore">Indore</option>
<option value="Jaipur">Jaipur</option>
<option value="Kochi">Kochi</option>
<option value="Kolkata">Kolkata</option>
<option value="Lucknow">Lucknow</option>
<option value="Mumbai">Mumbai</option>
<option value="Mysuru">Mysuru</option>
<option value="Nagpur">Nagpur</option>
<option value="Nashik">Nashik</option>
<option value="Patna">Patna</option>
<option value="Pune">Pune</option>
<option value="Raipur">Raipur</option>
<option value="Ranchi">Ranchi</option>
<option value="Surat">Surat</option>
<option value="Thiruvananthapuram">Thiruvananthapuram</option>
<option value="Vadodara">Vadodara</option>
<option value="Visakhapatnam">Visakhapatnam (Vizag)</option>
  
<option value="Australia">Australia</option>
<option value="Canada">Canada</option>
<option value="Germany">Germany</option>
<option value="Ireland">Ireland</option>
<option value="Kuwait">Kuwait</option>
<option value="Malaysia">Malaysia</option>
<option value="Netherlands">Netherlands</option>
<option value="New Zealand">New Zealand</option>
<option value="Oman">Oman</option>
<option value="Qatar">Qatar</option>
<option value="Saudi Arabia">Saudi Arabia</option>
<option value="Singapore">Singapore</option>
<option value="UAE">UAE</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div class="input-group">
                      <input type="submit" value="Search" class="sub" />
                    </div>
                  </form>
                </div>
              </div>
              
              <div className="col-lg-9">
                {isSearchActive && (
                  <div className="alert alert-info d-flex justify-content-between align-items-center">
                    <span>
                      Showing search results 
                      {searchFilters.ageFrom && ` | Age: ${searchFilters.ageFrom}`}
                      {searchFilters.ageTo && ` - ${searchFilters.ageTo}`}
                      {searchFilters.maritalStatus && ` | Status: ${searchFilters.maritalStatus}`}
                      {searchFilters.gender && ` | Gender: ${searchFilters.gender}`}
                    </span>
                    <button className="btn btn-sm btn-secondary" onClick={clearSearch}>
                      Clear Search
                    </button>
                  </div>
                )}

                <div className="displayresult">
                  <div className="row">
                    <div className="col-lg-3">
                      <div className="listby">
                        <a href="#" title="Result by List View">
                          <i className="fas fa-th-list" aria-hidden="true"></i>
                        </a>
                        <a href="#" title="Result by Gallery View">
                          <i className="fas fa-th-large" aria-hidden="true"></i>
                        </a>
                      </div>
                    </div>
                    <div className="col-lg-9">
                      Displaying Results: {userList.length > 0 ? `${start} - ${end}` : '0'} from {totalRecords} Profiles
                    </div>
                  </div>
                </div>

                <div className="listing">
                  <ul className="profile-listing">
                    {userList.length > 0 ? (
                      userList.map(res => (
                        <li className="feature" key={res.uid}>
                          <div className="row">
                            <div className="col-lg-2 col-md-3">
                              <div className="listingImg">
                                <img 
                                  src={imageUrl(res.profileImage)} 
                                  alt="" 
                                  style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover', 
                                    objectPosition: 'top', 
                                    aspectRatio: '1 / 1.3' 
                                  }} 
                                />
                              </div>
                            </div>
                        {/* <div className="col-lg-2 col-md-3">
                                <div className="listingImg">
                                  <PhotoProvider>
                                    <PhotoView src={res.profileImage}>
                                      <img
                                        src={res.profileImage}
                                        alt="Profile"
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          objectFit: 'cover',
                                          objectPosition: 'top',
                                          aspectRatio: '1 / 1.3',
                                          cursor: 'pointer'
                                        }}
                                      />
                                    </PhotoView>
                                  </PhotoProvider>
                                </div>
                           </div> */}

                            <div className="col-lg-8 col-md-6">
                              <h3 className="user-name">
                                <a href="#">MAT{res.uid}-{res.ufname}</a>
                              </h3>
                              <ul className="listingInfo">
                                <li title="Age">
                                  <i className="far fa-calendar-alt"></i>
                                  {res.udob 
                                    ? res.udob.split("/")[1] + '/' + res.udob.split("/")[0] + '/' + res.udob.split("/")[2]
                                    : "Not Available"}
                                </li>
                                <li title="Location">
                                  <i className="fas fa-map-marker-alt"></i> {res.familyresidence}
                                </li>
                                <li title="Gender">
                                  <i className="fas fa-female"></i> {res.ugender}
                                </li>
                                <li title="Education">
                                  <i className="fas fa-book-open"></i> {res.ujob}
                                </li>
                                <li title="Marital Status">
                                  <i className="fas fa-book-open"></i> {res.maritalstatus}
                                </li>
                                <li title="Height">
                                  <i className="fas fa-male"></i> {res.uheight} Ft
                                </li>
                              </ul>
                              <p>{res.about}</p>
                            </div>
                            <div className="col-lg-2 col-md-3">
                              <div className="listbtn">
                                <a href="javascript:void(0)" className="btn save_job">
                                  <i className="far fa-star" aria-hidden="true"></i> Save
                                </a>
                               <Link
  to={`/ProfileDetails/${res.uid}`}
  className="btn apply"
  onClick={() => {
    sessionStorage.setItem('listingScrollY', String(window.scrollY));
    sessionStorage.setItem('listingScrollPage', String(page));
  }}
>
  <i className="fas fa-paper-plane" aria-hidden="true"></i> Details
</Link>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li>
                        <div className="row">
                          <div className="col-12 text-center">
                            <p>No profiles found matching your criteria.</p>
                          </div>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="blog-pagination text-center">
                  <a
                    href="#0"
                    onClick={(e) => { 
                      e.preventDefault();  
                      if (page > 1) updatePageInUrl(page - 1);
                    }}
                    className={page === 1 ? 'disabled' : ''}
                    aria-label="Previous"
                  >
                    <i className="fas fa-angle-left"></i>
                  </a>

                  {totalPages > 0 ? renderPageButtons() : (
                    <a 
                      href="#0" 
                      onClick={(e) => e.preventDefault()}
                      className="active"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '40px',
                        height: '40px',
                        borderRadius: '50%'
                      }}
                    >
                      {`Page ${page}`}
                    </a>
                  )}

                  <a
                    href="#0"
                    onClick={(e) => { 
                      e.preventDefault();  
                      if (page < totalPages) updatePageInUrl(page + 1);
                    }}
                    className={page === totalPages ? 'disabled' : ''}
                    aria-label="Next"
                  >
                    <i className="fas fa-angle-right"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Listing;