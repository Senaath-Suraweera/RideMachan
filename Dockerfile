# ---- Stage 1: build the WAR ----
# Pinned to the *build* machine's own architecture. A WAR is pure bytecode and
# therefore architecture-independent, so there is nothing to gain from running
# Maven under QEMU when cross-building for linux/amd64 — only a large slowdown.
FROM --platform=$BUILDPLATFORM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /build

# Copy the POM first so dependency resolution is cached independently of source changes.
COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests


# ---- Stage 2: runtime ----
# Tomcat 11 implements Servlet 6.1, which is what this project compiles against.
# This stage follows the --platform passed to the build (linux/amd64 for Render).
FROM tomcat:11.0-jdk17-temurin

# Drop Tomcat's bundled example/manager apps — not wanted on a public host.
RUN rm -rf /usr/local/tomcat/webapps/*

# Deploy as ROOT so the app serves at "/" and every root-relative
# path in the frontend (/views/..., /api/...) resolves correctly.
COPY --from=build /build/target/RideMachan-1.0-SNAPSHOT.war /usr/local/tomcat/webapps/ROOT.war

# Render's free instances have 512 MB; let the JVM size itself against the container limit.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8080

CMD ["catalina.sh", "run"]
