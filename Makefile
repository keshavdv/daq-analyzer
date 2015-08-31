.protobuf:
	protoc src/proto/* -I src/proto -o messages.desc

all:
	sass src/css/*.scss src/css/style.css
	/Applications/node-webkit.app/Contents/MacOS/node-webkit .
