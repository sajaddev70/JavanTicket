# Backend image: runs the jar already built into build/libs.
# Build it first with: ./gradlew clean bootJar   (deploy/package-release.sh does this and bundles the release)
# The jar is built outside Docker on purpose: Maven Central is unreliable from Iranian servers, while the
# runtime image comes from the ParsPack Docker mirror (docker.abrha.net).
ARG REGISTRY=docker.abrha.net
FROM ${REGISTRY}/eclipse-temurin:17-jre

ENV TZ=Asia/Tehran \
    SPRING_PROFILES_ACTIVE=prod \
    UPLOAD_DIR=/app/uploads \
    SERVER_PORT=8080 \
    JAVA_OPTS="-XX:MaxRAMPercentage=75"

# Unprivileged runtime user. A fresh named volume mounted on /app/uploads inherits this ownership.
RUN groupadd --system --gid 10001 app \
    && useradd --system --uid 10001 --gid app --home-dir /app --no-create-home --shell /usr/sbin/nologin app

WORKDIR /app
COPY --chown=app:app build/libs/*.jar app.jar
RUN mkdir -p /app/uploads && chown app:app /app/uploads

USER app
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
