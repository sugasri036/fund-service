# =====================================================
# 1. BUILD FRONTEND
# =====================================================

FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm ci

COPY frontend/ .

RUN npm run build


# =====================================================
# 2. BUILD SPRING BOOT
# =====================================================

FROM maven:3.9-eclipse-temurin-21 AS backend-build

WORKDIR /app

COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

RUN chmod +x mvnw

COPY src src

# Copy React production build into Spring Boot static folder
COPY --from=frontend-build /app/frontend/dist src/main/resources/static

RUN ./mvnw clean package -DskipTests


# =====================================================
# 3. RUN APPLICATION
# =====================================================

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=backend-build /app/target/*.jar app.jar

EXPOSE 10000

ENTRYPOINT ["java", "-jar", "app.jar"]