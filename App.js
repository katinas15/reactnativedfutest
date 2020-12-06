import React from 'react';
import {
  AppRegistry,
  TouchableHighlight,
  NativeModules,
  NativeEventEmitter,
  Platform,
  StyleSheet,
  Text,
  View,
  Image
} from "react-native";

import { NordicDFU, DFUEmitter } from "react-native-nordic-dfu";
import BleManager from "react-native-ble-manager";
import RNFetchBlob from 'rn-fetch-blob'
import DocumentPicker from 'react-native-document-picker';


const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
const DEVICE_ID = "EF:EF:DA:98:65:0B";

const { config, fs } = RNFetchBlob


import RNFS from 'react-native-fs';

export default class NordicDFUExample extends React.Component {
  constructor(props) {
    super(props);
    this.handleDeviceDiscovered = this.handleDeviceDiscovered.bind(this);
    this.startScan = this.startScan.bind(this);
    this.handleStopScan = this.handleStopScan.bind(this);

    this.state = {
      imagefile: "",
      scanning: false,
      deviceFound: false,
      dfuState: "Not started",
      progress: 0,
      items: ['asdasd'],
      isDone: false,
      destination: ""
    };



    RNFS.downloadFile({
      fromUrl: 'https://facebook.github.io/react-native/img/header_logo.png',
      toFile: `${RNFS.DocumentDirectoryPath}/react-native.png`,
    }).promise.then(async (r) => {
      
      console.log(r)
      this.setState({ isDone: true })
      

      RNFS.exists(this.state.destination).then(r => {
        console.log(r)
      })

      RNFS.existsAssets(this.state.destination).then(r => {
        console.log(r)
      })
    });

    // config(options).fetch("GET", "https://facebook.github.io/react-native/img/header_logo.png" 
    //       ).then(res => {

    //       console.log(res)
    //       console.log(res.data)
    //       console.log(res.path())
    //       // console.log("file saved to", res.path());
    //       // RNFS.existsAssets(`react-native.png`).then(res => {
    //         //     console.log(res)
    //         //   })
    //       this.setState({ isDone: true })
    //       this.setState({ imagefile: res.path() });
    //   })
  


    BleManager.enableBluetooth()
    .then(() => {
      // Success code
      console.log("The bluetooth is already enabled or the user confirm");
    })
    .catch((error) => {
      // Failure code
      console.log("The user refuse to enable bluetooth");
    });
  }


  componentDidMount() {
    DFUEmitter.addListener("DFUProgress", ({ percent }) => {
      console.log("DFU progress:", percent);
      this.setState({ progress: percent });
    });
    DFUEmitter.addListener("DFUStateChanged", ({ state }) => {
      console.log("DFU state:", state);
      this.setState({ dfuState: state });
    });


    BleManager.start({ showAlert: false, allowDuplicates: false });
    bleManagerEmitter.addListener("BleManagerStopScan", this.handleStopScan);
    bleManagerEmitter.addListener(
      "BleManagerDiscoverPeripheral",
      this.handleDeviceDiscovered
    );
    this.startScan();
  }

  // #### DFU #######################################################

  async startDFU() {
    console.log("Starting DFU");
    
    const firmwareFile = await DocumentPicker.pick()
    const destination = RNFS.CachesDirectoryPath + "/firmwa.zip";

    await RNFS.copyFile(firmwareFile.uri, destination);

    console.log(destination)
    NordicDFU.startDFU({
      deviceAddress: DEVICE_ID,
      filePath: "/firmwa.zip"
    })
      .then(res => console.log("Transfer done: ", res))
      .catch(console.log);
  }

  // #### BLUETOOTH #################################################

  handleDeviceDiscovered({ id }) {
    // this.state.items.push(id)
    console.log(id)

    if (id == DEVICE_ID) {
      this.setState({
        deviceFound: true,
        scanning: false
      });
    }
  }

  handleStopScan() {
    console.log("Scan is stopped");
    if (this.state.scanning) {
      this.startScan();
    }
  }

  startScan() {
    BleManager.scan([], 3, true).then(results => {
      console.log("Scanning...");
      this.setState({ scanning: true });
    });
  }

  // #### RENDER #########################################################

  render() {

    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          {this.state.dfuState}
        </Text>
        <Text style={styles.welcome}>
          {"DFU progress: " + this.state.progress + " %"}
        </Text>
        <Text>
          {this.state.scanning ? "Scanning for: " + DEVICE_ID : "Not scanning"}
        </Text>
        <Text>
          {this.state.deviceFound
            ? "Found device: " + DEVICE_ID
            : "Device not found"}
        </Text>
        <Text>
          {this.state.items}
        </Text>
        <Text />
        {this.state.deviceFound
          ? <TouchableHighlight
              style={{ padding: 10, backgroundColor: "grey" }}
              onPress={this.startDFU.bind(this)}
            >
              <Text style={{ color: "white" }}>Start DFU</Text>
            </TouchableHighlight>
          : null}


          {
          this.state.isDone ? (<View>
                <Image style={{
                  width: 100,
                  height: 100,
                  backgroundColor: 'black',
                }}
                  source={{
                    uri: `file://${RNFS.DocumentDirectoryPath}/react-native.png`,
                    scale: 1
                  }}
                />
                <Text>{`file://${RNFS.DocumentDirectoryPath}/react-native.png`}</Text>
              </View>
              ) : null}
                </View>
              );
            }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF"
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5
  }
});

AppRegistry.registerComponent("NordicDFUExample", () => NordicDFUExample);
