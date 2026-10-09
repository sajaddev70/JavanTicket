# Backend image: runs the jar already built into build/libs.
# Build it first with: ./gradlew clean bootJar
# Base images come from the ParsPack Docker mirror (docker.abrha.net) so they download on Iranian servers.
ARG REGISTRY=docker.abrha.net
FROM ${REGISTRY}/eclipse-temurin:17-jre

ENV TZ=Asia/Tehran \
    SPRING_PROFILES_ACTIVE=prod \
    UPLOAD_DIR=/app/uploads \
    SERVER_PORT=8081 \
    JAVA_OPTS="-XX:MaxRAMPercentage=75"

WORKDIR /app
COPY build/libs/*.jar app.jar
RUN mkdir -p /app/uploads

EXPOSE 8081
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
