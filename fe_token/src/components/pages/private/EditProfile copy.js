import React from 'react'
import Profiles from '../../templates/ImagesLoader'
import Sidebar from './templates/Sidebar'
const EditProfile = () => {
  return (
    <>
    
  <div class="inner-heading" style={{ backgroundImage: `url(${Profiles.titlebg})` }}>
  <div class="container">
  <h3>Female Rishta Proposal for Abbasi in Islamabad</h3>
  </div>
</div>
  {/* <!--Inner Heading End--> 
  
  <!--Inner Content Start--> */}
  <div class="inner-content">
     
    <div class="container">
      <div class="profile-Wrap">
        <div class="row">
            
      <Sidebar></Sidebar>
          <div class="col-lg-8 col-md-8">
            <div class="translateY-60"> 
              {/* <!-- General Information --> */}
              <div class="add-listing-box edit-info mrg-bot-25 padd-bot-30 padd-top-25">
                <div class="listing-box-header">
                  <div class="avater-box"> <img src={Profiles.authorimg} class="img-responsive img-circle edit-avater" alt=""/>
                    <div class="upload-btn-wrapper">
                      <button class="btn theme-btn">Change Avatar</button>
                      <input type="file" name="myfile"/>
                    </div>
                  </div>
                  <h3>Personal Information</h3>
                </div>
                <div class="row mrg-r-10 mrg-l-10">
                  <div class="col-lg-6 col-md-6">
                    <label>First Name</label>
                    <input type="text" class="form-control" value="Daniel Deve"/>
                  </div>
                  <div class="col-lg-6 col-md-6">
                    <label>Last Name</label>
                    <input type="text" class="form-control" value="Daniel Deve"/>
                  </div>
                  <div class="col-lg-6 col-md-6">
                    <label>Gender</label>
                    <input type="text" class="form-control" value="Daniel Deve"/>
                  </div>
                  <div class="col-lg-6 col-md-6">
                    <label>Place of birth</label>
                    <input type="text" class="form-control" value="Daniel Deve"/>
                  </div>
                  <div class="col-lg-6 col-md-6">
                    <label>DOB</label>
                    <input type="text" name="" data-datedropper placeholder="Date of Birth" class="datedropper form-control"/>
                  </div>
                  <div class="col-lg-6 col-md-6">
                    <label>TOB</label>
                    <input type="text" name="" data-datedropper placeholder="Time of Birth" class="datedropper form-control"/>
                  </div>
               
                <div class="col-lg-6 col-md-6">
                    <label>Caste</label>
                    <input type="text" class="form-control" value=""/>
                  </div>
                  <div class="col-lg-6 col-md-6">
                    <label>Martial Status</label>
                    <select class="form-control">
                      <option value="">Single</option>
                      <option value="">Married</option>
                      <option value="">Divorced</option>
                      <option value="">Married But Looking</option>
                    </select>
                  </div>
                  <div class="col-lg-6 col-md-6">
                    <label>Height</label>
                    <select class="form-control">
                      <option value="">5`1</option>
                      <option value="">5`2</option>
                      <option value="">5`3</option>
                    </select>
                  </div> 

                  <div class="col-lg-6 col-md-6">
                    <label>Country of Residence</label>
                    <input type="text" class="form-control" value="91 258 587 4123"/>
                  </div>
                  <div class="col-lg-6 col-md-6">
                    <label>State</label>
                    <input type="text" class="form-control" value="91 258 587 4123"/>
                  </div>
                  <div class="col-lg-6 col-md-6">
                    <label>City</label>
                    <input type="text" class="form-control" value=""/>
                  </div>
                 
                  <div class="col-lg-12">
                    <label>About Yourself</label>
                    <textarea class="form-control" placeholder="Introduction"></textarea>
                  </div>
                </div>
              </div>
              {/* <!-- End General Information --> 
              
              <!-- Edit Location --> */}
              <div class="add-listing-box add-location mrg-bot-25 padd-bot-30 padd-top-25">
                <div class="listing-box-header"><i class="fas fa-map-marker-alt"></i>
                  <h3>Horoscope Details</h3>
                  <p>Ensure compatibility in marriage through detailed astrological analysis of birth charts.</p>
                </div>
                <form>
                  <div class="row mrg-r-10 mrg-l-10">
                    <div class="col-lg-6">
                      <label>Nakshtra</label>
                      <input type="text" class="form-control" value="Ardra"/>
                    </div>
                    <div class="col-lg-6">
                      <label>Padam</label>
                      <input type="text" class="form-control" value="3"/>
                    </div>
                    <div class="col-lg-6">
                      <label>Rasi</label>
                      <input type="text" class="form-control" value="Midhuna"/>
                    </div>
                      
                    
                  </div>
                </form>
              </div>
              {/* <!-- End Edit Location --> 
              
              <!-- contact info --> */}
              <div class="add-listing-box add-location mrg-bot-25 padd-bot-30 padd-top-25">
                <div class="listing-box-header"><i class="fas fa-map-marker-alt"></i>
                  <h3>Contact Information</h3>
                </div>
                <div class="row mrg-r-10 mrg-l-10">
                  <div class="col-lg-6">
                    <label>Email</label>
                    <input type="email" class="form-control" value="" placeholder=""/>
                  </div>
                  <div class="col-lg-6">
                    <label>Mobile Number</label>
                    <input type="text" class="form-control" value="" placeholder="9xxxxxxxx"/>
                  </div> 
                </div>
              </div>
              {/* <!-- End Social Background --> 
              <!-- Qualification And Career --> */}
              <div class="add-listing-box add-location mrg-bot-25 padd-bot-30 padd-top-25">
                <div class="listing-box-header"><i class="fas fa-map-marker-alt"></i>
                  <h3>Educational and Professional Details</h3>
                </div>
                <div class="row mrg-r-10 mrg-l-10">
                  <div class="col-lg-6">
                    <label>Select Fields of Study/Professions</label>
                    <select name="" class="form-control">
                      <option value="">-Select -</option>
                      <option value="Psychology Or Social Sciences">Psychology Or Social Sciences</option>
                      <option value="Business">Business</option>
                      <option value="Law">Law</option>
                      <option value="Medical">Medical</option>
                      <option value="Computer &amp; Information Technology">Computer &amp; Information Technology</option>
                      <option value="Arts">Arts</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Engineering Technology">Engineering Technology</option>
                      <option value="Fashions">Fashions</option>
                      <option value="Fine Arts">Fine Arts</option>
                      <option value="Finance &amp; Accounting">Finance &amp; Accounting</option>
                      <option value="Education">Education</option>
                      <option value="Architecture">Architecture</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div class="col-lg-6">
                    <label>Education Levels:</label>
                    <select data-placeholder="Choose City" class="form-control chosen-select" tabindex="2">
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
                    </select>
                  </div>
                  <div class="col-lg-6">
                    <label>Location</label>
                    <input type="text" class="form-control" value="" placeholder="e.g. Web Designer"/>
                  </div>
                  <div class="col-lg-6">
                    <label>Job Location</label>
                    <input type="text" class="form-control" value="" placeholder="e.g. Web Designer"/>
                  </div>
                  <div class="col-lg-6">
                    <label>Monthly Income</label>
                    <div class="input-group">
                      <div class="input-group-prepend"> <span class="input-group-text">INR</span> </div>
                      <input type="text" class="form-control" value="" placeholder="e.g. 100000"/>
                    </div>
                  </div>
                </div>
              </div>
              {/* <!-- End Qualification And Career --> 
              
              <!-- Physical Info --> */}
              <div class="add-listing-box add-location mrg-bot-25 padd-bot-30 padd-top-25">
                <div class="listing-box-header"><i class="fas fa-map-marker-alt"></i>
                  <h3> Family Background</h3>
                </div>
                <div class="row mrg-r-10 mrg-l-10">
                  <div class="col-lg-6">
                    <label>Father Name</label>
                    <input type="text" class="form-control" value="" placeholder="e.g. Web Designer"/>
                  </div>
                  <div class="col-lg-6">
                    <label>Father Occupation</label>
                    <input type="text" class="form-control" value="" placeholder="e.g. Web Designer"/>
                  </div>
                  <div class="col-lg-6">
                    <label>Mother Name</label>
                    <input type="text" class="form-control" value="" placeholder="e.g. Web Designer"/>
                  </div>
                  <div class="col-lg-6">
                    <label>Mother Occupation</label>
                    <input type="text" class="form-control" value="" placeholder="e.g. Web Designer"/>
                  </div> 
                  <div class="col-lg-6">
                    <label>Brothers</label>
                    <input type="text" class="form-control" value="" placeholder="e.g. Web Designer"/>
                  </div>
                  <div class="col-lg-6">
                    <label>Married Brothers</label>
                    <input type="text" class="form-control" value="" placeholder="e.g. Web Designer"/>
                  </div>
                  <div class="col-lg-6">
                    <label>Sisters</label>
                    <input type="text" class="form-control" value="" placeholder="e.g. Web Designer"/>
                  </div>
                  <div class="col-lg-6">
                    <label>Married Sisters</label>
                    <input type="text" class="form-control" value="" placeholder="e.g. Web Designer"/>
                  </div>
                  <div class="col-lg-6">
                    <label>Current Family Residence</label>
                    <input type="text" class="form-control" value="" placeholder="e.g. Web Designer"/>
                  </div>
                </div>
              </div>
              {/* <!-- End Physical Info --> 
              
              <!-- Hobbies --> */}
              <div class="add-listing-box add-location mrg-bot-25 padd-bot-30 padd-top-25">
                <div class="listing-box-header"><i class="fas fa-map-marker-alt"></i>
                  <h3>Lifestyle Information</h3>
                </div>
                <div class="row mrg-r-10 mrg-l-10">
                <div class="col-lg-6 col-md-6">
                    <label> Diet</label>
                    <select class="form-control">
                      <option value="">Vegetarian</option>
                      <option value="">Non-Vegetarian</option>
                      <option value="">Eggterian</option> 
                    </select>
                  </div>
                  <div class="col-lg-6">
                    <label>Smoking Habits</label>
                    <input type="text" class="form-control" value="" placeholder=""/>
                  </div>
                  <div class="col-lg-6">
                    <label>Drinking Habits</label>
                    <input type="text" class="form-control" value="" placeholder=""/>
                  </div> 
                </div>
              </div>
              {/* <!-- End Hobbies --> 
              
              <!-- Social Background --> */}
              <div class="add-listing-box add-location mrg-bot-25 padd-bot-30 padd-top-25">
                <div class="listing-box-header"><i class="fas fa-map-marker-alt"></i>
                  <h3>Preferences for Partner</h3>
                </div>
                <div class="row mrg-r-10 mrg-l-10">
                  <div class="col-lg-6">
                    <label>Preferred Age Range</label>
                    <input type="text" class="form-control" value="" placeholder=""/>
                  </div>
                  <div class="col-lg-6">
                    <label>Preferred Height Range</label>
                    <input type="text" class="form-control" value="" placeholder=""/>
                  </div>
                  <div class="col-lg-6">
                    <label>Preferred Education Level</label>
                    <input type="text" class="form-control" value="" placeholder=""/>
                  </div>
                  <div class="col-lg-12">
                      <label>Other Preferences (Specific qualities or hobbies desired in a partner)</label>
                      <textarea class="form-control"></textarea>
                    </div>
                </div>
              </div>
              {/* <!-- End Social Background --> 
              
              <!-- Life Style --> */}
             
              {/* <!-- End Life Style --> 
              
              <!-- Full Information --> */}
             
              <div class="text-center">
                <button class="btn theme-btn" title="Update Profile">Update Profile</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </>
  )
}

export default EditProfile