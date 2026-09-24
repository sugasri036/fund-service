# =====================================================
# 1. BUILD REACT FRONTEND
# =====================================================

FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm ci

COPY frontend/ .

RUN npm run build


# =====================================================
# 2. BUILD SPRING BOOT APPLICATION
# =====================================================

FROM maven:3.9-eclipse-temurin-21 AS backend-build

WORKDIR /app

# Copy Maven configuration first
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

RUN chmod +x mvnw

# Download Maven dependencies
RUN ./mvnw dependency:go-offline

# Copy backend source
COPY src src

# Copy React production build into Spring Boot static folder
COPY --from=frontend-build /app/frontend/dist src/main/resources/static

# Build Spring Boot JAR
RUN ./mvnw clean package -DskipTests


# =====================================================
# 3. RUNTIME IMAGE
# =====================================================

FROM eclipse-temurin:21-jre

WORKDIR /app


# =====================================================
# CREATE NON-ROOT USER
# =====================================================

RUN groupadd --system --gid 10001 spring \
    && useradd --system \
       --uid 10001 \
       --gid 10001 \
       --home-dir /app \
       --shell /usr/sbin/nologin \
       spring


# =====================================================
# COPY APPLICATION JAR
# =====================================================

COPY --from=backend-build /app/target/*.jar app.jar


# =====================================================
# APPLICATION PORT
# =====================================================

EXPOSE 8081


# =====================================================
# RUN AS NON-ROOT USER
# =====================================================

USER 10001:10001


# =====================================================
# JVM CONTAINER CONFIGURATION
# =====================================================

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]