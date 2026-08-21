<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %><%
    /*
     * Root of the site. Tomcat picks this up as the welcome file for "/",
     * so this is what visitors hit first.
     *
     * A redirect is used rather than a forward on purpose: views/landing/index.html
     * references its assets relatively ("styles.css", "../../logo.png",
     * "customer_sign-in.html"). A forward would leave the browser's address at "/",
     * so those would resolve against the wrong base and every asset and nav link
     * would 404. Redirecting moves the browser to the real path first.
     *
     * getContextPath() keeps this correct both on Render (deployed as ROOT, so the
     * context path is empty) and under a named context locally.
     */
    response.sendRedirect(request.getContextPath() + "/views/landing/index.html");
%>
