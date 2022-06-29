FROM sonatype/nexus3:3.38.0 as nexus_source

FROM openjdk:8 as builder
RUN mkdir -p /tmp/workspace /tmp/target
COPY . /tmp/workspace
WORKDIR /tmp/workspace
RUN ./mvnw clean install -DskipTests -pl :nexus-base -am
RUN cp /tmp/workspace/components/nexus-base/target/nexus-base-3.38.0-01.jar /tmp/target

FROM sonatype/nexus3:3.38.0
RUN whoami
USER root
COPY --from=builder /tmp/target/nexus-base-3.38.0-01.jar /opt/sonatype/nexus/system/org/sonatype/nexus/nexus-base/3.38.0-01/nexus-base-3.38.0-01.jar
USER nexus

