FROM ubuntu@sha256:2fdb1cf4995abb74c035e5f520c0f3a46f12b3377a59e86ecca66d8606ad64f9 AS app

RUN apt-get update && apt upgrade -y
RUN apt-get install -y build-essential

WORKDIR /build

CMD ["make", "all"]