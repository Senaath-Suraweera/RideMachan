<%--
  Created by IntelliJ IDEA.
  User: senaathsuraweera
  Date: 2025-07-30
  Time: 19:46
  To change this template use File | Settings | File Templates.
--%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
    <title>Title</title>
</head>
<body>

</body>
</html>

/*
2. Basic Building Blocks
Start & End
^   // start of string
$   // end of string
 Character Sets
[A-Z]   // uppercase letters
[a-z]   // lowercase letters
[0-9]   // digits

Combine:

[A-Za-z0-9]   // letters + numbers

Add symbols:

[A-Za-z0-9_.-]
 Quantity (VERY IMPORTANT)
Symbol	Meaning
+	1 or more
*	0 or more
?	0 or 1
{3}	exactly 3
{3,}	3 or more
{3,6}	between 3 and 6
3. Build Patterns Step by Step
Example 1: Only letters
/^[A-Za-z]+$/

Only letters, at least 1

Example 2: Letters + numbers
/^[A-Za-z0-9]+$/
 Example 3: Username (your case)
/^[A-Za-z0-9_.-]+$/
Example 4: Username (min 5, max 10)
/^[A-Za-z0-9_.-]{5,10}$/
 Example 5: Only numbers (exact 10 digits)
/^[0-9]{10}$/
 Example 6: No spaces allowed
/^\S+$/

 \S = no whitespace

 4. Special Shortcuts
Shortcut	Meaning
\d	digit (0–9)
\w	word (A-Z, a-z, 0-9, _)
\s	space
\S	no space
.	any character

Example:

/^\w+$/   // letters + numbers + _

Forgetting start/end
[A-Za-z]+   // WRONG (partial match allowed)
Correct
/^[A-Za-z]+$/
Wrong dash usage
[A-Z-]   // can break range
 Correct
[A-Za-z0-9_.\-]
 6. Real JS Example
const pattern = /^[A-Za-z0-9_.-]{5,10}$/;

let value = "user_123";

if (pattern.test(value)) {
console.log("Valid");
} else {
console.log("Invalid");
}
*/