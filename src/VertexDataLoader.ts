import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { MultiMaterial } from "@babylonjs/core/Materials/multiMaterial";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import type { Scene } from "@babylonjs/core/scene";
import { RotateAngleAxisVertexDataInPlace } from "./VertexDataUtils";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Color3 } from "@babylonjs/core/Maths/math.color";

class VertexDataInfo {

    public name: string = "";
    public position: Vector3 = Vector3.Zero();
}

class VertexDataWithInfo {
    
    constructor(
        public vertexDatas: VertexData[],
        public infos: VertexDataInfo[]
    ) {

    }

    public serialize(): any {
        let datas = {
            vertexDatas: new Array(),
            infos: new Array()
        }

        for (let i = 0; i < this.vertexDatas.length; i++) {
            let bVData: VertexData = this.vertexDatas[i];
            if (bVData.positions) {
                for (let i = 0; i < bVData.positions.length; i++) {
                    bVData.positions[i] = Math.floor(bVData.positions[i] * 1000) / 1000;
                }
            }
            if (bVData.normals) {
                for (let i = 0; i < bVData.normals.length; i++) {
                    bVData.normals[i] = Math.floor(bVData.normals[i] * 1000) / 1000;
                }
            }
            datas.vertexDatas[i] = bVData.serialize();
        }
        for (let i = 0; i < this.infos.length; i++) {
            datas.infos[i] = {
                name: this.infos[i].name,
                position: this.infos[i].position.asArray(),
            }
        }

        return datas;
    }

    public static CreateFromData(data: any): VertexDataWithInfo {
        let vertexDatas = [];
        let infos = [];

        for (let i = 0; i < data.vertexDatas.length; i++) {
            let vertexData = new VertexData();
            vertexData.positions = data.vertexDatas[i].positions;
            vertexData.indices = new Uint16Array(data.vertexDatas[i].indices);
            vertexData.normals = data.vertexDatas[i].normals;
            vertexData.uvs = data.vertexDatas[i].uvs;
            vertexData.colors = data.vertexDatas[i].colors;
            vertexDatas[i] = vertexData;
        }

        for (let i = 0; i < data.infos.length; i++) {
            let info = new VertexDataInfo();
            info.name = data.infos[i].name;
            info.position = Vector3.FromArray(data.infos[i].position);
            infos[i] = info;
        }

        return new VertexDataWithInfo(vertexDatas, infos);
    }
}

export class VertexDataLoader {

    public static instance: VertexDataLoader;

    public scene: Scene;
    public vertexDatas: Map<string, VertexDataWithInfo>;

    constructor(scene: Scene) {
        this.scene = scene;
        this.vertexDatas = new Map<string, VertexDataWithInfo>();
        VertexDataLoader.instance = this;
    }

    public serialize(): any {
        let datas: Array<{ key: string, value: any }> = [];
        this.vertexDatas.forEach((vData, name) => {
            datas.push({
                key: name,
                value: vData.serialize()
            });
        })
        return datas;
    }

    public deserialize(data: any): void {
        for (let i = 0; i < data.length; i++) {
            this.vertexDatas.set(data[i].key, VertexDataWithInfo.CreateFromData(data[i].value));
        }
    }

    public static clone(data: VertexData): VertexData {
        let clonedData = new VertexData();
        if (data.positions) {
            clonedData.positions = [...data.positions];
        }
        if (data.indices) {
            clonedData.indices = [...data.indices];
        }
        if (data.normals) {
            clonedData.normals = [...data.normals];
        }
        if (data.matricesIndices) {
            clonedData.matricesIndices = [...data.matricesIndices];
        }
        if (data.matricesWeights) {
            clonedData.matricesWeights = [...data.matricesWeights];
        }
        if (data.uvs) {
            clonedData.uvs = [...data.uvs];
        }
        if (data.colors) {
            clonedData.colors = [...data.colors];
        }
        return clonedData;
    }

    public async getInfos(url: string, scene?: Scene): Promise<VertexDataInfo[]> {
        if (!this.vertexDatas.get(url)) {
            await this.get(url, scene);
        }
        if (this.vertexDatas.has(url)) {
            return this.vertexDatas.get(url)!.infos;
        }
        return [];
    }

    public async get(url: string, scene?: Scene): Promise<VertexData[]> {
        if (this.vertexDatas.get(url)) {
            return this.vertexDatas.get(url)!.vertexDatas;
        }
        let vertexData: VertexData | undefined = undefined;
        let loadedFile = await SceneLoader.ImportMeshAsync("", url, "", scene);
        let vertexDatas: VertexData[] = [];
        let infos: VertexDataInfo[] = [];
        let gltfCase = false;
        if (loadedFile.meshes && loadedFile.meshes[0] && loadedFile.meshes[0].name === "__root__") {
            gltfCase = true;
        }
        let loadedFileMeshes = loadedFile.meshes.sort(
            (m1, m2) => {
                if (m1.name < m2.name) {
                    return -1;
                }
                else if (m1.name > m2.name) {
                    return 1;
                }
                return 0;
            }
        )
        for (let i = 0; i < loadedFileMeshes.length; i++) {
            let loadedMesh = loadedFileMeshes[i];
            if (loadedMesh instanceof Mesh) {
                vertexData =  VertexData.ExtractFromMesh(loadedMesh);
                if (vertexData.positions && vertexData.positions.length > 0) {
                    let colors: number[] = [];
                    if (loadedMesh.material) {
                        if (loadedMesh.material instanceof PBRMaterial) {
                            let color = loadedMesh.material.albedoColor;
                            for (let k = 0; k < vertexData.positions.length / 3; k++) {
                                let index = k;
                                colors[4 * index] = color.r;
                                colors[4 * index + 1] = color.g;
                                colors[4 * index + 2] = color.b;
                                colors[4 * index + 3] = 1;
                            }
                        }
                        else if (loadedMesh.material instanceof MultiMaterial) {
                            for (let j = 0; j < loadedMesh.material.subMaterials.length; j++) {
                                let subMaterial = loadedMesh.material.subMaterials[j];
                                if (subMaterial instanceof PBRMaterial) {
                                    let color = subMaterial.albedoColor;
                                    let subMesh = loadedMesh.subMeshes.find(sm => { return sm.materialIndex === j; });
                                    if (subMesh) {
                                        for (let k = 0; k < subMesh.verticesCount; k++) {
                                            let index = subMesh.verticesStart + k;
                                            colors[4 * index] = color.r;
                                            colors[4 * index + 1] = color.g;
                                            colors[4 * index + 2] = color.b;
                                            colors[4 * index + 3] = 1;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (colors.length === 0) {
                        for (let i = 0; i < vertexData.positions.length / 3; i++) {
                            colors.push(1, 1, 1, 1);
                        }
                    }
                    vertexData.colors = colors;
                    vertexDatas.push(vertexData);
                    
                    if (gltfCase) {
                        RotateAngleAxisVertexDataInPlace(vertexData, Math.PI, Axis.Y);
                    }

                    let vertexDataInfos = new VertexDataInfo();
                    vertexDataInfos.name = loadedMesh.name;
                    vertexDataInfos.position = loadedMesh.position.clone();
                    infos.push(vertexDataInfos);
                }
            }
        }
        this.vertexDatas.set(url, new VertexDataWithInfo(vertexDatas, infos));
        loadedFileMeshes.forEach(m => { m.dispose(); });
        loadedFile.skeletons.forEach(s => { s.dispose(); });
        return vertexDatas;
    }

    public async getAtIndex(url: string, index: number = 0, scene?: Scene): Promise<VertexData | undefined> {
        let datas = await this.get(url, scene);
        if (datas) {
            return datas[index];
        }
        return undefined;
    }

    public async getAndInstantiateAtIndex(name: string, url: string, index: number = 0, scene?: Scene): Promise<Mesh> {
        let data = await this.getAtIndex(url, index, scene);
        let mesh = new Mesh(name, scene);
        if (data) {
            data.applyToMesh(mesh);
        }
        return mesh;
    }

    public async getColorized(
        url: string, 
        baseColorHex: string = "#FFFFFF",
        frameColorHex: string = "",
        color1Hex: string = "", // Replace red
        color2Hex: string = "", // Replace green
        color3Hex: string = "" // Replace blue
    ): Promise<VertexData> {
        let vertexDatas = await this.getColorizedMultiple(url, baseColorHex, frameColorHex, color1Hex, color2Hex, color3Hex);
        return vertexDatas[0];
    }

    public async getColorizedMultiple(
        url: string, 
        baseColorHex: string = "#FFFFFF",
        frameColorHex: string = "",
        color1Hex: string = "", // Replace red
        color2Hex: string = "", // Replace green
        color3Hex: string = "" // Replace blue
    ): Promise<VertexData[]> {
        let baseColor: Color3 |undefined = undefined;
        if (baseColorHex !== "") {
            baseColor = Color3.FromHexString(baseColorHex);
        }
        let frameColor: Color3 |undefined = undefined;
        if (frameColorHex !== "") {
            frameColor = Color3.FromHexString(frameColorHex);
        }
        let color1: Color3 |undefined = undefined;
        if (color1Hex !== "") {
            color1 = Color3.FromHexString(color1Hex);
        }
        let color2: Color3 |undefined = undefined;
        if (color2Hex !== "") {
            color2 = Color3.FromHexString(color2Hex);
        }
        let color3: Color3 |undefined = undefined;
        if (color3Hex !== "") {
            color3 = Color3.FromHexString(color3Hex);
        }
        let vertexDatas = await VertexDataLoader.instance.get(url);
        let colorizedVertexDatas: VertexData[] = [];
        for (let d = 0; d < vertexDatas.length; d++) {
            let vertexData = vertexDatas[d];
            let colorizedVertexData = VertexDataLoader.clone(vertexData);
            if (colorizedVertexData.colors) {
                for (let i = 0; i < colorizedVertexData.colors.length / 4; i++) {
                    let r = colorizedVertexData.colors[4 * i];
                    let g = colorizedVertexData.colors[4 * i + 1];
                    let b = colorizedVertexData.colors[4 * i + 2];
                    if (baseColor) {
                        if (r === 1 && g === 1 && b === 1) {
                            colorizedVertexData.colors[4 * i] = baseColor.r;
                            colorizedVertexData.colors[4 * i + 1] = baseColor.g;
                            colorizedVertexData.colors[4 * i + 2] = baseColor.b;
                            continue;
                        }
                    }
                    if (frameColor) {
                        if (r === 0.502 && g === 0.502 && b === 0.502) {
                            colorizedVertexData.colors[4 * i] = frameColor.r;
                            colorizedVertexData.colors[4 * i + 1] = frameColor.g;
                            colorizedVertexData.colors[4 * i + 2] = frameColor.b;
                            continue;
                        }
                    }
                    if (color1) {
                        if (r === 1 && g === 0 && b === 0) {
                            colorizedVertexData.colors[4 * i] = color1.r;
                            colorizedVertexData.colors[4 * i + 1] = color1.g;
                            colorizedVertexData.colors[4 * i + 2] = color1.b;
                            continue;
                        }
                    }
                    if (color2) {
                        if (r === 0 && g === 1 && b === 0) {
                            colorizedVertexData.colors[4 * i] = color2.r;
                            colorizedVertexData.colors[4 * i + 1] = color2.g;
                            colorizedVertexData.colors[4 * i + 2] = color2.b;
                            continue;
                        }
                    }
                    if (color3) {
                        if (r === 0 && g === 0 && b === 1) {
                            colorizedVertexData.colors[4 * i] = color3.r;
                            colorizedVertexData.colors[4 * i + 1] = color3.g;
                            colorizedVertexData.colors[4 * i + 2] = color3.b;
                            continue;
                        }
                    }
                }
            }
            else {
                let colors: number[] = [];
                if (colorizedVertexData.positions && baseColor) {
                    for (let i = 0; i < colorizedVertexData.positions.length / 3; i++) {
                        colors[4 * i] = baseColor.r;
                        colors[4 * i + 1] = baseColor.g;
                        colors[4 * i + 2] = baseColor.b;
                        colors[4 * i + 3] = 1;
                    }
                    colorizedVertexData.colors = colors;
                }
            }
            colorizedVertexDatas.push(colorizedVertexData);
        }
        return colorizedVertexDatas;
    }
}