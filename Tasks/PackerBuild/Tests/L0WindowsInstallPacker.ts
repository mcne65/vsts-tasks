import ma = require('vsts-task-lib/mock-answer');
import tmrm = require('vsts-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..\\src\\main.js');
let tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tr.setInput('templateType', process.env["__template_type__"] || 'builtin');
tr.setInput('azureResourceGroup', 'testrg');
tr.setInput('storageAccountName', 'teststorage');
tr.setInput('baseImageSource', 'default');
tr.setInput('baseImage', 'MicrosoftWindowsServer:WindowsServer:2012-R2-Datacenter:windows');
tr.setInput('location', 'South India');
tr.setInput('packagePath', '**/*.zip');
tr.setInput('deployScriptPath', 'C:\\deploy.ps1');
tr.setInput('deployScriptArguments', "-target \"subdir 1\" -shouldFail false");
tr.setInput('ConnectedServiceName', 'AzureRMSpn');
tr.setInput('imageUri', 'imageUri');
tr.setInput('imageStorageAccount', 'imageStorageAccount');

process.env["ENDPOINT_AUTH_AzureRMSpn"] = "{\"parameters\":{\"serviceprincipalid\":\"spId\",\"serviceprincipalkey\":\"spKey\",\"tenantid\":\"tenant\"},\"scheme\":\"ServicePrincipal\"}";
process.env["ENDPOINT_DATA_AzureRMSpn_SUBSCRIPTIONNAME"] = "sName";
process.env["ENDPOINT_DATA_AzureRMSpn_SUBSCRIPTIONID"] =  "sId";
process.env["ENDPOINT_DATA_AzureRMSpn_SPNOBJECTID"] =  "oId";
process.env["RELEASE_RELEASENAME"] = "Release-1";

// provide answers for task mock
let a: any = <any>{
    "which": {
        "packer": process.env["__packer_exists__"] === "true" ? "packer" : null
    },
    "checkPath": {
        "packer": true,
        "basedir\\DefaultTemplates\\default.windows.template.json": true,
        "C:\\deploy.ps1": true
    },
    "exec": {
        "packer --version": {
            "code": 0,
            "stdout": process.env["__lower_version__"] === "true" ? "0.11.2" : "0.12.3"
        },
        "F:\\somedir\\tempdir\\100\\packer\\packer.exe fix -validate=false F:\\somedir\\tempdir\\100\\default.windows.template.json": {
            "code": 0,
            "stdout": "{ \"some-key\": \"some-value\" }"
        },
        "F:\\somedir\\tempdir\\100\\packer\\packer.exe validate -var resource_group=testrg -var storage_account=teststorage -var image_publisher=MicrosoftWindowsServer -var image_offer=WindowsServer -var image_sku=2012-R2-Datacenter -var location=South India -var capture_name_prefix=Release-1 -var script_path=C:\\deploy.ps1 -var script_name=deploy.ps1 -var package_path=C:\\dummy.zip -var package_name=dummy.zip -var script_arguments=-target \"subdir 1\" -shouldFail false -var subscription_id=sId -var client_id=spId -var client_secret=spKey -var tenant_id=tenant -var object_id=oId F:\\somedir\\tempdir\\100\\default.windows.template-fixed.json": {
            "code": 0,
            "stdout": "Executed Successfully"
        },
        "F:\\somedir\\tempdir\\100\\packer\\packer.exe build -force -var resource_group=testrg -var storage_account=teststorage -var image_publisher=MicrosoftWindowsServer -var image_offer=WindowsServer -var image_sku=2012-R2-Datacenter -var location=South India -var capture_name_prefix=Release-1 -var script_path=C:\\deploy.ps1 -var script_name=deploy.ps1 -var package_path=C:\\dummy.zip -var package_name=dummy.zip -var script_arguments=-target \"subdir 1\" -shouldFail false -var subscription_id=sId -var client_id=spId -var client_secret=spKey -var tenant_id=tenant -var object_id=oId F:\\somedir\\tempdir\\100\\default.windows.template-fixed.json": {
            "code": 0,
            "stdout": "Executed Successfully\nOSDiskUri: https://bishalpackerimages.blob.core.windows.net/system/Microsoft.Compute/Images/packer/packer-osDisk.e2e08a75-2d73-49ad-97c2-77f8070b65f5.vhd\nStorageAccountLocation: SouthIndia"
        }
    },
    "exist": {
        "F:\\somedir\\tempdir\\100": true,
        "F:\\somedir\\tempdir\\100\\": true,
        "packer": true       
    },
    "rmRF": {
        "F:\\somedir\\tempdir\\100": { 'success': true }
    },
    "osType": {
        "osType": "Windows_NT"
    }
};

var ut = require('../src/utilities');
tr.registerMock('./utilities', {
    IsNullOrEmpty : ut.IsNullOrEmpty,
    HasItems : ut.HasItems,
    StringWritable: ut.StringWritable,
    PackerVersion: ut.PackerVersion,
    isGreaterVersion: ut.isGreaterVersion,
    deleteDirectory: function(dir) {
        console.log("rmRF " + dir);
    },
    download: function(packerDownloadUrl, downloadPath) {
        if(process.env["__download_fails__"] === "true") {
            throw "packer download failed!!";
        }
        console.log('downloading from url ' + packerDownloadUrl + ' to ' + downloadPath);
    },
    unzip: function(zipLocation, unzipLocation) {
        if(process.env["__extract_fails__"] === "true") {
            throw "packer zip extraction failed!!";
        }
        console.log('extracting from zip ' + zipLocation + ' to ' + unzipLocation);
    },
    copyFile: function(source: string, destination: string) {
        console.log('copying ' + source + ' to ' + destination);
    },
    writeFile: function(filePath: string, content: string) {
        console.log("writing to file " + filePath + " content: " + content);
    },
    findMatch: function(root: string, patterns: string[] | string) {
        if(patterns === '**/*.zip') {
            return ["C:\\dummy.zip"];
        }

        return [patterns];
    },
    getCurrentTime: function() {
        return 100;
    },
    getTempDirectory: function() {
        return "F:\\somedir\\tempdir"
    },
    getCurrentDirectory: function() {
        return "basedir\\currdir";
    }
}); 

tr.setAnswers(a);
tr.run();