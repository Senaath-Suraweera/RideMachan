# Test Cases for Rental Company Driver Management Module

## 1. Add Driver Functionality

| Scenario ID | Scenario Description | Test Case ID | Pre-Condition | Steps to execute | Expected result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| 01 | View Add Driver Modal | 01 | Company admin logged in | Click "Add Driver" button | Add Driver modal opens successfully | Modal displays with form fields for driver details | Pass |
| 01 | View Add Driver Modal | 02 | Add Driver modal open | Observe form fields | All required fields displayed (username, firstname, lastname, area, email, mobilenumber, password, confirmpassword, nicnumber, licencenumber, licenceExpiration, nic upload, driverlicence upload, description) | All 14 form fields rendered correctly with proper labels | Pass |
| 02 | Add Driver with Valid Data | 01 | Company admin logged in, modal open | Fill all required fields with valid data, Click "Add Driver" button | Driver successfully added to system, modal closes, success notification appears | Form submitted to `/driver/signup` endpoint, driver record created in database, success message "Driver added successfully!" displayed | Pass |
| 02 | Add Driver with Valid Data | 02 | Add Driver modal open | Fill username, firstname, lastname, area, email, mobilenumber, password, confirmpassword, nicnumber, licencenumber, licenceExpiration, upload NIC file, upload licence file, add description, Click "Add Driver" | Verify new driver appears in drivers grid with correct details | New driver card rendered with driver name, ID, area, phone, licence number, and expiration date | Pass |
| 03 | Add Driver with Invalid Data | 01 | Add Driver modal open | Leave required field (username) empty, Click "Add Driver" button | HTML5 validation prevents submission, error message displayed for required field | Form validation blocks submission before reaching server | Pass |
| 03 | Add Driver with Invalid Data | 02 | Add Driver modal open | Leave email field empty, Click "Add Driver" button | Validation message displayed for email field | Required field validation triggered, submission blocked | Pass |
| 04 | Add Driver with Missing File Uploads | 01 | Add Driver modal open | Fill all text fields but don't upload NIC document, Click "Add Driver" | Validation error displayed for missing NIC file | Form validation blocks submission, NIC upload required message shown | Pass |
| 04 | Add Driver with Missing File Uploads | 02 | Add Driver modal open | Fill all text fields but don't upload driver licence, Click "Add Driver" | Validation error displayed for missing licence file | Form validation blocks submission, licence upload required message shown | Pass |
| 05 | Cancel Add Driver | 01 | Add Driver modal open | Click "Cancel" button | Modal closes without saving data, form reset | Modal removed from DOM, form cleared | Pass |
| 05 | Cancel Add Driver | 02 | Add Driver modal with data entered | Click modal close button (X), Click "Cancel" | Modal closes and returns to driver list | Modal hidden, driver grid still visible | Pass |
| 06 | Password Validation | 01 | Add Driver modal open | Enter password "pass", confirm password "pass123" | Mismatch not caught by frontend but submitted to server | Form allows submission but server should validate | Partial |
| 06 | Password Validation | 02 | Add Driver modal open | Enter matching passwords, Click "Add Driver" | Passwords accepted, driver added successfully | Passwords hashed server-side using PasswordServices.hashPassword() | Pass |

---

## 2. Search Driver Functionality

| Scenario ID | Scenario Description | Test Case ID | Pre-Condition | Steps to execute | Expected result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| 07 | Search Driver by Name | 01 | Drivers list loaded with multiple drivers | Enter driver first name "John" in search field | Only drivers with first name containing "John" displayed | List filtered in real-time, showing only matching drivers | Pass |
| 07 | Search Driver by Name | 02 | Drivers list loaded (10+ drivers) | Enter "Smith" in search field | Only drivers with last name "Smith" displayed | Filtering works for both first and last names, grid updated with matching results | Pass |
| 08 | Search Driver by Driver ID | 01 | Drivers list loaded | Enter driver ID "5" in search field | Driver with ID 5 displays in grid | System recognizes numeric input as ID search, displays single driver card | Pass |
| 08 | Search Driver by Driver ID | 02 | Drivers list loaded | Enter "123" in search field | Driver with ID 123 displays (if exists) | If driver exists, card displayed; if not, empty grid shown | Pass |
| 09 | Clear Search Filter | 01 | Search applied (showing filtered results) | Clear search input field | All drivers displayed again | Grid refreshed with complete driver list, search reset | Pass |
| 09 | Clear Search Filter | 02 | Search input has text "John" | Delete all text from search field | All drivers reappear in grid | LoadAllDrivers() called, grid re-renders with all drivers | Pass |
| 10 | Search Case Insensitivity | 01 | Drivers list loaded | Enter "JOHN" in uppercase in search field | Drivers with name "john", "John", "JOHN" all displayed | Search converted to lowercase for comparison, case-insensitive matching works | Pass |
| 10 | Search Case Insensitivity | 02 | Drivers list loaded | Enter "john" in lowercase | Same results as uppercase search | Filtering handles case conversion properly | Pass |
| 11 | Search with No Results | 01 | Drivers list loaded | Enter name that doesn't match any driver "XYZDriver" | Empty grid displayed with no driver cards | Grid cleared, no results shown | Pass |
| 11 | Search with No Results | 02 | Drivers list loaded | Enter ID that doesn't exist "9999" | Empty grid with no matching driver | System handles no matches gracefully | Pass |
| 12 | Search with Special Characters | 01 | Drivers list loaded | Enter "John O'Brien" with apostrophe | Driver with apostrophe in name filtered correctly | Search handles special characters in names | Pass |
| 12 | Search with Special Characters | 02 | Drivers list loaded | Enter name with spaces "John Paul" | Drivers with "John Paul" in first or last name displayed | Multi-word search processed correctly | Pass |
| 13 | Real-time Search Updates | 01 | Drivers list loaded, search input focused | Type "J", observe results; type "o", observe results; type "hn" | Grid updates dynamically after each keystroke, showing results progressively | Event listener on search-input triggers filter on each input event, results update in real-time | Pass |

---

## 3. Filter Driver Functionality

| Scenario ID | Scenario Description | Test Case ID | Pre-Condition | Steps to execute | Expected result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| 14 | View Filter Dropdown | 01 | Driver management page loaded | Observe filter dropdown | Filter dropdown visible with options (All Drivers, Available, On Trip) | Filter select element rendered with proper options | Pass |
| 14 | View Filter Dropdown | 02 | Drivers list displayed | Click on filter dropdown | Dropdown expands showing all status options | Dropdown opens, options visible | Pass |
| 15 | Filter by "All Drivers" | 01 | Drivers list loaded | Select "All Drivers" from filter dropdown | All drivers in system displayed | Grid shows all driver cards | Pass |
| 15 | Filter by "All Drivers" | 02 | Previously filtered view showing limited drivers | Select "All Drivers" | Grid updates to show complete driver list | filterDriversByDriverStatus("all") called, all drivers rendered | Pass |
| 16 | Filter by "Available" Status | 01 | Drivers list loaded with mixed statuses | Select "Available" from filter dropdown | Only drivers with "Available" status displayed | Event listener not properly attached to filter dropdown - filtering does not work | Fail |
| 16 | Filter by "Available" Status | 02 | Multiple drivers with different statuses exist | Apply "Available" filter | Driver cards show only those with status badge showing "Available" | Dropdown selection doesn't trigger filter function - all drivers still displayed | Fail |
| 17 | Filter by "On Trip" Status | 01 | Drivers list loaded with mixed statuses | Select "On Trip" from filter dropdown | Only drivers currently on trip displayed in grid | Filter dropdown change event handler missing - filtering not functional | Fail |
| 17 | Filter by "On Trip" Status | 02 | Multiple trips active | Apply "On Trip" filter | Grid shows only drivers with "On Trip" status badge | Select change event listener not connected to filterDriversByDriverStatus function | Fail |
| 18 | Filter Display Accuracy | 01 | "Available" filter applied | Count visible driver cards | Count matches number of available drivers in database | Filter logic incomplete - unable to validate | Fail |
| 18 | Filter Display Accuracy | 02 | "On Trip" filter applied | Verify each displayed driver has correct status badge | All cards show status-on trip badge styling | Status badges render correctly for drivers, but filter selection itself is non-functional | Partial |
| 19 | Reset Filter | 01 | "Available" filter applied (assuming functional) | Click "All Drivers" option | Grid refreshes to show all drivers | Would return to full list if filter was working | Fail |
| 19 | Reset Filter | 02 | Any filter applied | Select "All Drivers" option | Driver count increases to show full database | Filter reset logic depends on functional dropdown listener | Fail |
| 20 | Filter with Search Combination | 01 | Filter dropdown and search both functional | Apply "Available" filter AND search "John" | Results show only available drivers named John | Filter functionality incomplete, only search works - filter ignored | Partial |
| 20 | Filter with Search Combination | 02 | Apply multiple filters together | Use status filter AND enter search text | Grid shows intersection of both criteria | Search works independently, but filter + search combination not fully functional | Partial |

---

## Summary of Implementation Status

### Implemented & Working (Pass):
- ✅ Add Driver functionality (form validation, submission, database insertion)
- ✅ Search by driver name (first and last name)
- ✅ Search by driver ID
- ✅ Real-time search with input event listener
- ✅ Case-insensitive search
- ✅ Clear search functionality
- ✅ Modal open/close for driver form

### Not Implemented / Not Working (Fail):
- ❌ Filter by driver status (dropdown not connected to filter function)
- ❌ Filter change event listener missing in JavaScript
- ❌ "Available" status filter non-functional
- ❌ "On Trip" status filter non-functional
- ❌ Filter + Search combination not working together

### Partial Implementation:
- ⚠️ Password confirmation validation (frontend allows mismatch, should be caught)
- ⚠️ Filter with status badges display correctly, but filtering logic incomplete
- ⚠️ Filter dropdown exists but lacks event handling

---

## Issues Found

### Issue 1: Filter Dropdown Event Listener Missing
**Location:** `driver-management.js`
**Problem:** The filter dropdown (`.filter-select`) has no change event listener attached
**Impact:** Status filtering completely non-functional
**Fix Required:** Add event listener to filter-select element:
```javascript
document.querySelector(".filter-select").addEventListener("change", function() {
    filterDriversByDriverStatus(this.value);
});
```

### Issue 2: Password Confirmation Not Validated
**Location:** `driver-management.html` form validation
**Problem:** Form allows submission even if password and confirmpassword don't match
**Impact:** Users can inadvertently create drivers with mismatched passwords
**Fix Required:** Add client-side validation before form submission

### Issue 3: Filter and Search Not Integrated
**Location:** `driver-management.js`
**Problem:** Filter and search functions operate independently, not as combined criteria
**Impact:** Users cannot filter AND search simultaneously
**Fix Required:** Refactor filtering logic to consider both search term and selected status

