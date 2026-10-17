
import React, { useState } from "react";
import Profiles from '../../templates/ImagesLoader'
import Sidebar from './templates/Sidebar'
//mui
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
//ICONs
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PhoneIcon from "@mui/icons-material/Phone";
import InputAdornment from "@mui/material/InputAdornment";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee"


//end of icons
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";
const theme = createTheme({
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "&.Mui-error .MuiOutlinedInput-notchedOutline": {
            borderColor: "#ffcccc",
          },
        },
        input: {
          "&[readonly]": {
            backgroundColor: "#f0f0f0", // Light grey color
          },
        },
      },
    },
  },
});

const countries = [
  { label: "India" },
  { label: "United States" },
  { label: "Australia" },
  { label: "Canada" },
  { label: "Germany" },
];
const states = [
  { label: "Andhra Pradesh" },
  { label: "Telangana" },
  { label: "Kerala" },
  { label: "Delhi" },
  { label: "Karnataka" },
];
const cities = [
  { label: "Hyderabad" },
  { label: "Siddipet" },
  { label: "Karimnagar" },
  { label: "Sircilla" },
  { label: "Vemulawada" },
];
const heights = [{ label: "5" }, { label: "5-1" }, { label: "5-2" }];
const genders = [{ label: "Male" }, { label: "Female" }]
const castes = [{ label: "Goldsmith" }, { label: "Carpenter" }, { label: "Kamma" }, { label: "Kapu" }, { label: "Brahmin" }];
const MaritalStatus = [{ label: "Single" }, { label: "Married" }, { label: "Divorced" }]
const nakshtras = [{ label: "Ardra" }, { label: "Shathabhisha" }, { label: "Swathi" }, { label: "Anuradha" }, { label: "Vishaka" }]
const padams = [{ label: "1" }, { label: "2" }, { label: "3" }, { label: "4" }]
const rasi = [{ label: "Midhuna" }, { label: "Simha" }, { label: "Tula" }]
const professions = [{ "label": "Psychology Or Social Sciences" }, { "label": "Business" }, { "label": "Law" }, { "label": "Medical" }, { "label": "Computer &amp; Information Technology" }, { "label": "Arts" }, { "label": "Commerce" }, { "label": "Engineering Technology" }, { "label": "Fashions" }, { "label": "Fine Arts" }, { "label": "Finance &amp; Accounting" }, { "label": "Education" }, { "label": "Architecture" }, { "label": "Others" }]
const degree = [{ "label": "Matriculation/O-Level" }, { "label": "Intermediate/A-Level" }, { "label": "Bachelors" }, { "label": "Masters" }, { "label": "MPhil/MS" }, { "label": "PHD/Doctorate" }, { "label": "Certification" }, { "label": "Diploma" }, { "label": "Short Course" }]
const inrOptions = [{ label: "Thousand" }, { label: "Lakhs" }, { label: "Crores" }]
const diet = [{ label: "Vegeterian" }, { label: "Eggitarian?" }, { label: "Non-vegetarian" }]
const habitsOptions = [{ label: "Never" }, { label: "Occasionally" }, { label: "Socially" }, { label: "Regularly" }]

const EditProfile = () => {
  //input handler states
  const [lname, setLname] = useState();
  const [lastError, setLastError] = useState();
  const [genderValue, setGenderValue] = useState();
  const [salaryNum, setSalaryNum] = useState("");
  const [salaryUnits, setSalaryUnits] = useState(inrOptions[1]);
  const [salaryMessage, setSalaryMessage] = useState("")
  const [maleSiblings, setMaleSiblings] = useState("")
  const [maleSiblingsMarried, setMaleSiblingsMarried] = useState("")
  const [femaleSiblings, setFemaleSiblings] = useState("")
  const [femaleSiblingsMarried, setFemaleSiblingsMarried] = useState("")
  //end of input handler states

  const handleMaleSiblingsChange = (event) => {
    const value = event.target.value;
    if (/^\d*$/.test(value)) {
      setMaleSiblings(value)
    }
  }
  const handleMaleSiblingsMarried = (event) => {
    const value = event.target.value;
    if (/^\d*$/.test(value)) {
      setMaleSiblingsMarried(value)
    }
  }
  const handleFemaleSiblingsChange = (event) => {
    const value = event.target.value;
    if (/^\d*$/.test(value)) {
      setFemaleSiblings(value)
    }
  }
  const handleFemaleSiblingsMarried = (event) => {
    const value = event.target.value;
    if (/^\d*$/.test(value)) {
      setFemaleSiblingsMarried(value)
    }
  }
  const handleSalaryNumChange = (event) => {
    const value = event.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setSalaryNum(value); updateSalaryMessage(value, salaryUnits);
    }

  }; const handleSalaryUnitsChange = (event, newValue) => {
    setSalaryUnits(newValue); updateSalaryMessage(salaryNum, newValue);
  };
  const updateSalaryMessage = (num, units) => {
    if (num && units) {
      setSalaryMessage(`** ${num} ${units.label} per Annum`);
    } else { setSalaryMessage(""); }
  };
  //inputs Handlers 
  const handleLastNameChange = (e) => {
    let value = e.target.value;
    setLname(value)
    setLastError(value.length < 5);
  }
  const handleGenderChange = (e) => {
    let value = e.target.value;
    setGenderValue(value)
  }
  //end of input handlers
  return (
    <>  <ThemeProvider theme={theme}>

      <div className="inner-heading" style={{ backgroundImage: `url(${Profiles.titlebg})` }}>
        <div className="container">
          <h3>Female Rishta Proposal for Abbasi in Islamabad</h3>
        </div>
      </div>
      {/* <!--Inner Heading End--> 
  
  <!--Inner Content Start--> */}
      <div className="inner-content">

        <div className="container">
          <div className="profile-Wrap">
            <div className="row">

              <Sidebar></Sidebar>
              <div className="col-lg-8 col-md-8">
                <div className="translateY-60">
                  {/* <!-- General Information --> */}
                  <div className="add-listing-box edit-info mrg-bot-25 padd-bot-30 padd-top-25">
                    <div className="listing-box-header">
                      <div className="avater-box"> <img src={Profiles.authorimg} className="img-responsive img-circle edit-avater" alt="" />
                        <div className="upload-btn-wrapper">
                          <button className="btn theme-btn">Change Avatar</button>
                          <input type="file" name="myfile" />
                        </div>
                      </div>
                      <h3>Personal Information</h3>
                    </div>
                    <div className="row mrg-r-10 mrg-l-10">
                      <div className="col-lg-6 col-md-6"> {/* Container Box for consistent size */}
                        {/* <label>First Name</label> <input type="text" class="form-control" value="Daniel Deve"/> */}
                        <TextField label="First Name" variant="outlined" InputProps={{
                          readOnly: false, startAdornment: (<InputAdornment position="start">
                            <PersonIcon /> </InputAdornment>),
                        }} margin="normal" fullWidth // Ensures the TextField takes full width of the Box 
                        />   </div>
                      <div className="col-lg-6 col-md-6">
                        {/* <label>Last Name</label><input type="text" className="form-control" value="Daniel Deve" /> */}

                        <TextField
                          label="Last Name"
                          variant="outlined"
                          value={lname}
                          onChange={handleLastNameChange}
                          error={lastError}
                          helperText={
                            lastError ? "Input must be at least 5 characters long" : ""
                          }
                          InputProps={{// icon
                            readOnly: false, startAdornment: (<InputAdornment position="start">
                              <PersonIcon /> </InputAdornment>),
                          }} margin="normal" fullWidth // Ensures the TextField takes full width of the Box 

                        />
                      </div>
                      <div className="col-lg-6 col-md-6">
                        {/* <label>Gender</label> <input type="text" className="form-control" value="Daniel Deve" /> */}
                        <Autocomplete
                          options={genders}
                          getOptionLabel={(option) => option.label}
                          value={genderValue}
                          onChange={handleGenderChange}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Gender"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                      <div className="col-lg-6 col-md-6">
                        {/* <label>Place of birth</label> <input type="text" className="form-control" value="Daniel Deve" /> */}
                        <TextField
                          label="Place of birth"
                          variant="outlined"
                          value={lname}
                          // onChange={handlePobChange}
                          // error={lastError}
                          helperText={
                            lastError ? "Input must be at least 5 characters long" : ""
                          }
                          InputProps={{// icon
                            readOnly: false, startAdornment: (<InputAdornment position="start">
                              <LocationOnIcon /> </InputAdornment>),
                          }} margin="normal" fullWidth // Ensures the TextField takes full width of the Box 

                        />
                      </div>
                      <div className="col-lg-6 col-md-6">

                        {/* <label>DOB</label> <input type="text" name="" data-datedropper placeholder="Date of Birth" className="datedropper form-control" /> */}
                        <TextField
                          label="Date of Birth"
                          variant="outlined"
                          type="date"
                          // value={dobValue}
                          // onChange={handleDobChange}
                          // error={dobError}
                          // helperText={dobError ? "Please enter a valid date" : ""}
                          InputLabelProps={{ shrink: true }}
                          margin="normal" fullWidth
                        />
                      </div>
                      <div className="col-lg-6 col-md-6">
                        {/* <label>TOB</label><input type="text" name="" data-datedropper placeholder="Time of Birth" className="datedropper form-control" /> */}
                        <TextField
                          label="Time of Birth"
                          variant="outlined"
                          type="time"
                          // value={tobValue}
                          // onChange={handleTobChange}
                          InputProps={{// icon
                            readOnly: false, startAdornment: (<InputAdornment position="start">
                            </InputAdornment>),
                          }}
                          margin="normal" fullWidth
                        />
                      </div>

                      <div className="col-lg-6 col-md-6">
                        {/* <label>Caste</label><input type="text" className="form-control" value="" /> */}
                        <Autocomplete
                          options={castes}
                          getOptionLabel={(option) => option.label}
                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Caste"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                      <div className="col-lg-6 col-md-6">
                        {/* <label>Martial Status</label>
                        <select className="form-control">
                          <option value="">Single</option>
                          <option value="">Married</option>
                          <option value="">Divorced</option>
                          <option value="">Married But Looking</option>
                        </select> */}
                        <Autocomplete
                          options={MaritalStatus}
                          getOptionLabel={(option) => option.label}
                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Martial Status"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                      <div className="col-lg-6 col-md-6">
                        {/* <label>Height</label> */}
                        <Autocomplete
                          options={heights}
                          getOptionLabel={(option) => option.label}
                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Height"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>

                      <div className="col-lg-6 col-md-6">
                        {/* <label>Country of Residence</label> <input type="text" className="form-control" value="91 258 587 4123" /> */}
                        <Autocomplete
                          options={countries}
                          getOptionLabel={(option) => option.label}
                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Countries"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                      <div className="col-lg-6 col-md-6">
                        {/* <label>State</label><input type="text" className="form-control" value="91 258 587 4123" /> */}
                        <Autocomplete
                          options={states}
                          getOptionLabel={(option) => option.label}
                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select State"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                      <div className="col-lg-6 col-md-6">
                        {/* <label>City</label><input type="text" className="form-control" value="" /> */}

                        <Autocomplete
                          options={cities}
                          getOptionLabel={(option) => option.label}
                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Cities"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>


                      <div className="col-lg-12">
                        {/* <label>About Yourself</label><textarea className="form-control" placeholder="Introduction"></textarea> */}

                        <TextField
                          label="About Yourself"
                          variant="outlined"
                          multiline
                          rows={4}
                          // value={aboutValue}
                          // onChange={handleAboutChange}
                          margin="normal"
                          fullWidth
                        />
                      </div>

                    </div>
                  </div>
                  {/* <!-- End General Information --> 
              
              <!-- Edit Location --> */}
                  <div className="add-listing-box add-location mrg-bot-25 padd-bot-30 padd-top-25">
                    <div className="listing-box-header"><i className="fas fa-map-marker-alt"></i>
                      <h3>Horoscope Details</h3>
                      <p>Ensure compatibility in marriage through detailed astrological analysis of birth charts.</p>
                    </div>
                    <form>
                      <div className="row mrg-r-10 mrg-l-10">
                        <div className="col-lg-6">
                          {/* <label>Nakshtra</label><input type="text" className="form-control" value="Ardra" /> */}
                          <Autocomplete
                            options={nakshtras}
                            getOptionLabel={(option) => option.label}
                            // value={heightValue}
                            // onChange={(event, newValue) => setHeightValue(newValue)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Select Nakshtras"
                                variant="outlined"
                                margin="normal"
                              />
                            )}
                          />
                        </div>
                        <div className="col-lg-6">
                          {/* <label>Padam</label><input type="text" className="form-control" value="3" /> */}
                          <Autocomplete
                            options={padams}
                            getOptionLabel={(option) => option.label}
                            // value={heightValue}
                            // onChange={(event, newValue) => setHeightValue(newValue)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Select Padam"
                                variant="outlined"
                                margin="normal"
                              />
                            )}
                          />
                        </div>
                        <div className="col-lg-6">
                          {/* <label>Rasi</label><input type="text" className="form-control" value="Midhuna" /> */}
                          <Autocomplete
                            options={rasi}
                            getOptionLabel={(option) => option.label}
                            // value={heightValue}
                            // onChange={(event, newValue) => setHeightValue(newValue)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Select Rasi"
                                variant="outlined"
                                margin="normal"
                              />
                            )}
                          />
                        </div>


                      </div>
                    </form>
                  </div>
                  {/* <!-- End Edit Location --> 
              
              <!-- contact info --> */}
                  <div className="add-listing-box add-location mrg-bot-25 padd-bot-30 padd-top-25">
                    <div className="listing-box-header"><i className="fas fa-map-marker-alt"></i>
                      <h3>Contact Information</h3>
                    </div>
                    <div className="row mrg-r-10 mrg-l-10">
                      <div className="col-lg-6">
                        {/* <label>Email</label> <input type="email" className="form-control" value="" placeholder="" /> */}
                        <TextField label="Email" variant="outlined" InputProps={{
                          readOnly: false, startAdornment: (<InputAdornment position="start">
                            <EmailIcon /> </InputAdornment>),
                        }} margin="normal" fullWidth // Ensures the TextField takes full width of the Box 
                        />
                      </div>
                      <div className="col-lg-6">
                        {/* <label>Mobile Number</label><input type="text" className="form-control" value="" placeholder="9xxxxxxxx" /> */}
                        <TextField label="Mobile" variant="outlined" InputProps={{
                          readOnly: false, startAdornment: (<InputAdornment position="start">
                            <PhoneIcon /> </InputAdornment>),
                        }} margin="normal" fullWidth // Ensures the TextField takes full width of the Box 
                        />
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Social Background --> 
              <!-- Qualification And Career --> */}
                  <div className="add-listing-box add-location mrg-bot-25 padd-bot-30 padd-top-25">
                    <div className="listing-box-header"><i className="fas fa-map-marker-alt"></i>
                      <h3>Educational and Professional Details</h3>
                    </div>
                    <div className="row mrg-r-10 mrg-l-10">
                      <div className="col-lg-6">
                        {/* <label>Education Levels:</label>
                        <select data-placeholder="Choose City" className="form-control chosen-select" tabindex="2">
                          <option>Select Degree Type</option>
                          <option>Non-Matriculation </option>
                          <option>Matriculation/O-Level </option>
                          <option>Intermediate/A-Level </option>
                          <option>Bachelors</option>
                          <option>Masters </option>
                          <option>MPhil/MS</option>
                          <option>PHD/Doctorate</option>
                          <option>Certification </option>
                          <option>Diploma </option>
                          <option>Short Course</option>
                        </select> */}
                        <Autocomplete
                          options={degree}
                          getOptionLabel={(option) => option.label}
                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Degree/Education Levels"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                      <div className="col-lg-6">
                        {/* <label>Select Fields of Study/Professions</label>
                        <select name="" className="form-control">
                          <option value="">-Select -</option>
                          <option value="Business">Business</option>
                          <option value="Law">Law</option>
                          <option value="Medical">Medical</option>
                         
                        </select> */}
                        <Autocomplete
                          options={professions}
                          getOptionLabel={(option) => option.label}
                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Fields of Study/Professions"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>


                      <div className="col-lg-6">
                        {/* <label>Job Location</label><input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <Autocomplete
                          options={cities}
                          getOptionLabel={(option) => option.label}
                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Job Location"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                      <div className="col-lg-6"> <div className="row"> <div className="col-lg-4"> {/* Salary TextField */} <TextField label="Salary" variant="outlined" InputProps={{ readOnly: false, startAdornment: (<InputAdornment position="start"> <CurrencyRupeeIcon /> </InputAdornment>), }} margin="normal" fullWidth value={salaryNum} onChange={handleSalaryNumChange} /> </div> <div className="col-lg-8"> {/* INR Autocomplete */} <Autocomplete options={inrOptions} getOptionLabel={(option) => option.label} value={salaryUnits} onChange={handleSalaryUnitsChange} renderInput={(params) => (<TextField {...params} label="INR per annum" variant="outlined" margin="normal" />)} /> </div>
                      </div>
                        <Typography variant="body1" component="div" gutterBottom sx={{ color: 'green' }}> {salaryMessage} </Typography>
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Qualification And Career --> 
              
              <!-- Physical Info --> */}
                  <div className="add-listing-box add-location mrg-bot-25 padd-bot-30 padd-top-25">
                    <div className="listing-box-header"><i className="fas fa-map-marker-alt"></i>
                      <h3> Family Background</h3>
                    </div>
                    <div className="row mrg-r-10 mrg-l-10">
                      <div className="col-lg-6">
                        {/* <label>Father Name</label>  <input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <TextField label="Father Name" variant="outlined" margin="normal" fullWidth // Ensures the TextField takes full width of the Box 
                        />
                      </div>
                      <div className="col-lg-6">
                        {/* <label>Father Occupation</label> <input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <Autocomplete
                          options={professions}
                          getOptionLabel={(option) => option.label}
                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Father Occupation"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                      <div className="col-lg-6">
                        {/* <label>Mother Name</label> <input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <TextField label="Mother Name" variant="outlined" margin="normal" fullWidth // Ensures the TextField takes full width of the Box 
                        />
                      </div>
                      <div className="col-lg-6">
                        {/* <label>Mother Occupation</label> <input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <Autocomplete
                          options={professions}
                          getOptionLabel={(option) => option.label}
                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Mother Ocupation"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                      <div className="col-lg-6">
                        {/* <label>Brothers</label> <input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <TextField label="Brothers" variant="outlined"
                          margin="normal" fullWidth value={maleSiblings}
                          onChange={handleMaleSiblingsChange} />
                      </div>
                      <div className="col-lg-6">
                        {/* <label>Married Brothers</label><input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <TextField label="No. of Brothers Married" variant="outlined"
                          margin="normal" fullWidth value={maleSiblingsMarried}
                          onChange={handleMaleSiblingsMarried} />
                      </div>
                      <div className="col-lg-6">
                        {/* <label>Sisters</label>  <input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <TextField label="Sisters" variant="outlined"
                          margin="normal" fullWidth value={femaleSiblings}
                          onChange={handleFemaleSiblingsChange} />
                      </div>
                      <div className="col-lg-6">
                        {/* <label>Married Sisters</label><input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <TextField label="No. of Sisters Married" variant="outlined"
                          margin="normal" fullWidth value={femaleSiblingsMarried}
                          onChange={handleFemaleSiblingsMarried} />
                      </div>
                      <div className="col-lg-6">
                        {/* <label>Current Family Residence</label> <input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <Autocomplete
                          options={cities}
                          getOptionLabel={(option) => option.label}
                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Current Family Residence"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Physical Info --> 
              
              <!-- Hobbies --> */}
                  <div className="add-listing-box add-location mrg-bot-25 padd-bot-30 padd-top-25">
                    <div className="listing-box-header"><i className="fas fa-map-marker-alt"></i>
                      <h3>Lifestyle Information</h3>
                    </div>
                    <div className="row mrg-r-10 mrg-l-10">
                      <div className="col-lg-6 col-md-6">
                        {/* <label> Diet</label>
                        <select className="form-control">
                          <option value="">Vegetarian</option>
                          <option value="">Non-Vegetarian</option>
                          <option value="">Eggterian</option>
                        </select> */}
                        <Autocomplete
                          options={diet}
                          getOptionLabel={(option) => option.label}
                          value={genderValue}
                          onChange={handleGenderChange}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Diet"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                      <div className="col-lg-6">
                        {/* <label>Smoking Habits</label> <input type="text" className="form-control" value="" placeholder="" /> */}
                        <Autocomplete
                          options={habitsOptions}
                          getOptionLabel={(option) => option.label}
                          // value={genderValue}
                          // onChange={handleGenderChange}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Smoking Habit"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                      <div className="col-lg-6">
                        {/* <label>Drinking Habits</label>  <input type="text" className="form-control" value="" placeholder="" /> */}
                        <Autocomplete
                          options={habitsOptions}
                          getOptionLabel={(option) => option.label}
                          // value={genderValue}
                          // onChange={handleGenderChange}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Drinking Habit"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Hobbies --> 
              
              <!-- Social Background --> */}
                  <div className="add-listing-box add-location mrg-bot-25 padd-bot-30 padd-top-25">
                    <div className="listing-box-header"><i className="fas fa-map-marker-alt"></i>
                      <h3>Preferences for Partner</h3>
                    </div>
                    <div className="row mrg-r-10 mrg-l-10">
                      {/* <div className="col-lg-6">
                        <label>Preferred Age Range</label>
                        <input type="text" className="form-control" value="" placeholder="" />
                      </div>
                      <div className="col-lg-6">
                        <label>Preferred Height Range</label>
                        <input type="text" className="form-control" value="" placeholder="" />
                      </div>
                      <div className="col-lg-6">
                        <label>Preferred Education Level</label>
                        <input type="text" className="form-control" value="" placeholder="" />
                      </div> */}
                      <div className="col-lg-12">
                        {/* <label>Other Preferences (Specific qualities or hobbies desired in a partner)</label> */}
                        {/* <textarea className="form-control"></textarea> */}
                        <TextField
                          label="Other Preferences (Specific qualities or hobbies desired in a partner)"
                          variant="outlined"
                          multiline
                          rows={4}
                          // value={aboutValue}
                          // onChange={handleAboutChange}
                          margin="normal"
                          fullWidth
                        />
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Social Background --> 
              
              <!-- Life Style --> */}

                  {/* <!-- End Life Style --> 
              
              <!-- Full Information --> */}

                  <div className="text-center">
                    <button className="btn theme-btn" title="Update Profile">Update Profile</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
    </>
  )
}

export default EditProfile