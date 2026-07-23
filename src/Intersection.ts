/*
    Point
    Line
    Segment
    Ray
    Path
    Wire
    Plane
    AABB
    Triangle
    Sphere
    Capsule
    Mesh
*/

import { Ray } from "@babylonjs/core/Culling/ray";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Plane } from "@babylonjs/core/Maths/math.plane";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { ProjectPointOnPlane, ProjectPointOnPlaneToRef, Barycentric, ProjectPointOnSegmentToRef, AngleFromToAround, DistancePointSegment, RotateInPlace, ProjectPointOnPathToRef, ProjectPointOnSegment } from "./babylonjs-tiaratumgames-tools";
import { PlaneCollider } from "./Collider";
import { MinMax } from "./Number";

export interface IPlane {
    point: Vector3;
    normal: Vector3;
}

export interface ISphere {
    center: Vector3;
    radius: number;
}

export interface IBox {
    worldMatrix: Matrix;
    width: number;
    height: number;
    depth: number;
}

export interface ICylinder {
    worldMatrix: Matrix;
    radius: number;
    height: number;
}

export interface ICapsule {
    c1: Vector3;
    c2: Vector3;
    radius: number;
    worldMatrix?: Matrix;
}

export interface IIntersection {
    hit: boolean;
    point: Vector3 | undefined;
    normal: Vector3 | undefined;
    depth: number;
    index?: number; // when intersecting with a path
    localPoint?: Vector3; // when intersecting with a path
}

export class Intersection implements IIntersection {
    public hit: boolean = false;
    public point: Vector3 | undefined;
    public normal: Vector3 | undefined;
    public depth: number = 0;
    public index: number = -1;

    constructor() {}
}

export function SphereTriangleCheck(cSphere: Vector3, rSphere: number, p1: Vector3, p2: Vector3, p3: Vector3): boolean {
    return SphereAABBCheck(cSphere, rSphere, Math.min(p1.x, p2.x, p3.x), Math.max(p1.x, p2.x, p3.x), Math.min(p1.y, p2.y, p3.y), Math.max(p1.y, p2.y, p3.y), Math.min(p1.z, p2.z, p3.z), Math.max(p1.z, p2.z, p3.z));
}

export function SphereRayCheck(cSphere: Vector3, rSphere: number, ray: Ray): boolean {
    return SphereAABBCheck(cSphere, rSphere, Math.min(ray.origin.x, ray.origin.x + ray.direction.x), Math.max(ray.origin.x, ray.origin.x + ray.direction.x), Math.min(ray.origin.y, ray.origin.y + ray.direction.y), Math.max(ray.origin.y, ray.origin.y + ray.direction.y), Math.min(ray.origin.z, ray.origin.z + ray.direction.z), Math.max(ray.origin.z, ray.origin.z + ray.direction.z));
}

export function PointAABBCheck(p: Vector3, boxMin: Vector3, boxMax: Vector3): boolean;
export function PointAABBCheck(p: Vector3, x2Min: number, x2Max: number, y1Min: number, y2Max: number, z2Min: number, z2Max: number): boolean;
export function PointAABBCheck(p: Vector3, arg1: any, arg2: any, y1Min?: number, y1Max?: number, z1Min?: number, z1Max?: number): boolean {
    let x1Min: number;
    let x1Max: number;
    if (arg1 instanceof Vector3) {
        x1Min = arg1.x;
        x1Max = arg2.x;
        y1Min = arg1.y;
        y1Max = arg2.y;
        z1Min = arg1.z;
        z1Max = arg2.z;
    } else {
        x1Min = arg1;
        x1Max = arg2;
    }

    if (p.x >= x1Min) {
        if (p.x <= x1Max) {
            if (p.y >= y1Min!) {
                if (p.y <= y1Max!) {
                    if (p.z >= z1Min!) {
                        if (p.z <= z1Max!) {
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}

export function SphereAABBCheck(cSphere: Vector3, rSphere: number, boxMin: Vector3, boxMax: Vector3): boolean;
export function SphereAABBCheck(cSphere: Vector3, rSphere: number, x2Min: number, x2Max: number, y2Min: number, y2Max: number, z2Min: number, z2Max: number): boolean;
export function SphereAABBCheck(cSphere: Vector3, rSphere: number, arg1: any, arg2: any, y2Min?: number, y2Max?: number, z2Min?: number, z2Max?: number): boolean {
    let x2Min: number;
    let x2Max: number;
    if (arg1 instanceof Vector3) {
        x2Min = arg1.x;
        x2Max = arg2.x;
        y2Min = arg1.y;
        y2Max = arg2.y;
        z2Min = arg1.z;
        z2Max = arg2.z;
    } else {
        x2Min = arg1;
        x2Max = arg2;
    }
    return AABBAABBCheck(cSphere.x - rSphere, cSphere.x + rSphere, cSphere.y - rSphere, cSphere.y + rSphere, cSphere.z - rSphere, cSphere.z + rSphere, x2Min, x2Max, y2Min!, y2Max!, z2Min!, z2Max!);
}

export function AABBAABBCheck(box1Min: Vector3, box1Max: Vector3, box2Min: Vector3, box2Max: Vector3): boolean;
export function AABBAABBCheck(x1Min: number, x1Max: number, y1Min: number, y1Max: number, z1Min: number, z1Max: number, x2Min: number, x2Max: number, y2Min: number, y2Max: number, z2Min: number, z2Max: number): boolean;
export function AABBAABBCheck(arg1: any, arg2: any, arg3: any, arg4: any, z1Min?: number, z1Max?: number, x2Min?: number, x2Max?: number, y2Min?: number, y2Max?: number, z2Min?: number, z2Max?: number): boolean {
    let x1Min: number;
    let x1Max: number;
    let y1Min: number;
    let y1Max: number;
    if (arg1 instanceof Vector3) {
        x1Min = arg1.x;
        x1Max = arg2.x;
        y1Min = arg1.y;
        y1Max = arg2.y;
        z1Min = arg1.z;
        z1Max = arg2.z;

        x2Min = arg3.x;
        x2Max = arg4.x;
        y2Min = arg3.y;
        y2Max = arg4.y;
        z2Min = arg3.z;
        z2Max = arg4.z;
    } else {
        x1Min = arg1;
        x1Max = arg2;
        y1Min = arg3;
        y1Max = arg4;
    }

    if (x1Min > x2Max!) {
        return false;
    }
    if (x1Max < x2Min!) {
        return false;
    }
    if (y1Min > y2Max!) {
        return false;
    }
    if (y1Max < y2Min!) {
        return false;
    }
    if (z1Min! > z2Max!) {
        return false;
    }
    if (z1Max! < z2Min!) {
        return false;
    }
    return true;
}

export function RaySphereIntersection(ray: Ray, sphere: ISphere): IIntersection; // 1
export function RaySphereIntersection(ray: Ray, cSphere: Vector3, rSphere: number): IIntersection; // 2
export function RaySphereIntersection(ray: Ray, arg2?: any, rSphere?: number): IIntersection {
    let cSphere: Vector3;
    if (arg2 instanceof Vector3) {
        // 2
        cSphere = arg2;
    } else {
        // 1
        cSphere = (arg2 as ISphere).center;
        rSphere = (arg2 as ISphere).radius;
    }

    let intersection = new Intersection();

    if (SphereRayCheck(cSphere, rSphere!, ray)) {
        // todo
    }

    return intersection;
}

export function RayMeshIntersection(ray: Ray, mesh: Mesh): IIntersection {
    let intersection = new Intersection();

    let pickingInfo = ray.intersectsMesh(mesh);
    if (pickingInfo.hit) {
        intersection.hit = true;
        intersection.point = pickingInfo.pickedPoint!;
        intersection.normal = pickingInfo.getNormal(true)!;
        intersection.depth = ray.length - pickingInfo.distance;
    }

    return intersection;
}

export function RayPlaneIntersection(ray: Ray, plane: IPlane): IIntersection; // 1
export function RayPlaneIntersection(ray: Ray, pPlane: Vector3, nPlane: Vector3): IIntersection; // 2
export function RayPlaneIntersection(ray: Ray, arg1: any, nPlane?: any): IIntersection {
    let pPlane: Vector3;
    if (arg1 instanceof Vector3) {
        // 2
        pPlane = arg1;
    } else {
        // 1
        pPlane = (arg1 as IPlane).point;
        nPlane = (arg1 as IPlane).normal;
    }

    let intersection = new Intersection();
    let bjsPlane = Plane.FromPositionAndNormal(pPlane, nPlane);

    let d = ray.intersectsPlane(bjsPlane);
    if (d != null && d > 0.001 && d <= ray.length) {
        intersection.hit = true;
        intersection.point = ray.origin.add(ray.direction.scale(d));
        intersection.normal = nPlane.clone();
        intersection.depth = ray.length - d;
    }

    return intersection;
}

export function SpherePlaneIntersection(sphere: ISphere, plane: IPlane): IIntersection;
export function SpherePlaneIntersection(cSphere: Vector3, rSphere: number, plane: IPlane): IIntersection;
export function SpherePlaneIntersection(cSphere: Vector3, rSphere: number, pPlane: Vector3, nPlane: Vector3): IIntersection;
export function SpherePlaneIntersection(arg1: any, arg2: any, arg3?: any, nPlane?: Vector3): IIntersection {
    let cSphere: Vector3;
    let rSphere: number;
    let pPlane: Vector3;
    if (arg1 instanceof Vector3 && arg3 instanceof Vector3) {
        cSphere = arg1;
        rSphere = arg2;
        pPlane = arg3;
    } else if (arg1 instanceof Vector3) {
        cSphere = arg1;
        rSphere = arg2;
        pPlane = (arg3 as IPlane).point;
        nPlane = (arg3 as IPlane).normal;
    } else {
        cSphere = (arg1 as ISphere).center;
        rSphere = (arg1 as ISphere).radius;
        pPlane = (arg2 as IPlane).point;
        nPlane = (arg2 as IPlane).normal;
    }

    let intersection = new Intersection();

    let proj = ProjectPointOnPlane(cSphere, pPlane, nPlane!);

    let sqrDist = Vector3.DistanceSquared(cSphere, proj);
    if (sqrDist <= rSphere * rSphere) {
        let dist = Math.sqrt(sqrDist);
        intersection.hit = true;
        intersection.depth = rSphere - dist;
        intersection.point = proj;
        intersection.normal = nPlane!.clone();
    }

    return intersection;
}

var SphereBoxIntersectionTmpVec3_0 = Vector3.Zero();
var SphereBoxIntersectionTmpVec3_1 = Vector3.Zero();
var SphereBoxIntersectionTmpQuat_0 = Quaternion.Identity();
var SphereBoxIntersectionTmpMatrix_0 = Matrix.Identity();
export function SphereBoxIntersection(cSphere: Vector3, rSphere: number, box: IBox): IIntersection {
    let intersection: IIntersection = new Intersection();

    let scale: Vector3 = SphereBoxIntersectionTmpVec3_0;
    box.worldMatrix.decompose(scale, SphereBoxIntersectionTmpQuat_0, SphereBoxIntersectionTmpVec3_1);

    let invMatrix = SphereBoxIntersectionTmpMatrix_0;
    invMatrix.copyFrom(box.worldMatrix).invert();
    let localCSphere = Vector3.TransformCoordinates(cSphere, invMatrix);
    let localRadius = rSphere / scale.x;
    if (SphereAABBCheck(localCSphere, localRadius, -box.width * 0.5, box.width * 0.5, -box.height * 0.5, box.height * 0.5, -box.depth * 0.5, box.depth * 0.5)) {
        let point = new Vector3(MinMax(localCSphere.x, -box.width * 0.5, box.width * 0.5), MinMax(localCSphere.y, -box.height * 0.5, box.height * 0.5), MinMax(localCSphere.z, -box.depth * 0.5, box.depth * 0.5));
        let depthSign = 1;
        if (Vector3.DistanceSquared(localCSphere, point) === 0) {
            depthSign = -1;
            let dx = Math.min(Math.abs(point.x - box.width * 0.5), Math.abs(point.x + box.width * 0.5));
            let dy = Math.min(Math.abs(point.y - box.height * 0.5), Math.abs(point.y + box.height * 0.5));
            let dz = Math.min(Math.abs(point.z - box.depth * 0.5), Math.abs(point.z + box.depth * 0.5));

            if (dx <= dy && dx <= dz) {
                if (point.x > 0) {
                    point.x = box.width * 0.5;
                } else {
                    point.x = -box.width * 0.5;
                }
            } else if (dy <= dz) {
                if (point.y > 0) {
                    point.y = box.height * 0.5;
                } else {
                    point.y = -box.height * 0.5;
                }
            } else {
                if (point.z > 0) {
                    point.z = box.depth * 0.5;
                } else {
                    point.z = -box.depth * 0.5;
                }
            }
        }
        let depth = rSphere - depthSign * Vector3.Distance(point, localCSphere);

        if (depth > 0) {
            intersection.hit = true;
            intersection.depth = depth;
            intersection.point = point;
            intersection.normal = localCSphere.clone().subtractInPlace(intersection.point).scaleInPlace(depthSign).normalize();

            Vector3.TransformCoordinatesToRef(intersection.point, box.worldMatrix, intersection.point);
            Vector3.TransformNormalToRef(intersection.normal, box.worldMatrix, intersection.normal);
        }
    }
    return intersection;
}

var SphereCapsuleIntersectionTmpVec3_0 = Vector3.Zero();
var SphereCapsuleIntersectionTmpVec3_1 = Vector3.Zero();
export function SphereCapsuleIntersection(cSphere: Vector3, rSphere: number, c1Capsule: Vector3, c2Capsule: Vector3, rCapsule: number, worldMatrix?: Matrix): IIntersection {
    let intersection = new Intersection();

    let c1 = SphereCapsuleIntersectionTmpVec3_0;
    c1.copyFrom(c1Capsule);
    let c2 = SphereCapsuleIntersectionTmpVec3_1;
    c2.copyFrom(c2Capsule);

    if (worldMatrix) {
        Vector3.TransformCoordinatesToRef(c1, worldMatrix, c1);
        Vector3.TransformCoordinatesToRef(c2, worldMatrix, c2);
    }

    if (SphereAABBCheck(cSphere, rSphere, Math.min(c1.x, c2.x) - rCapsule, Math.max(c1.x, c2.x) + rCapsule, Math.min(c1.y, c2.y) - rCapsule, Math.max(c1.y, c2.y) + rCapsule, Math.min(c1.z, c2.z) - rCapsule, Math.max(c1.z, c2.z) + rCapsule)) {
        let dist = DistancePointSegment(cSphere, c1, c2);

        let depth = rSphere + rCapsule - dist;

        if (depth > 0) {
            intersection.hit = true;
            intersection.depth = depth;
            let proj = Vector3.Zero();
            ProjectPointOnSegmentToRef(cSphere, c1, c2, proj);
            let dir = cSphere.subtract(proj).normalize();
            intersection.point = dir.scale(rCapsule);
            intersection.point.addInPlace(proj);
            intersection.normal = dir;
        }
    }

    return intersection;
}

var SphereLatheIntersectionTmpVec3 = Vector3.Zero();
export function SphereLatheIntersection(cSphere: Vector3, rSphere: number, cLathe: Vector3, path: Vector3[], rWire: number = 0): IIntersection {
    let proj = SphereLatheIntersectionTmpVec3;
    proj.copyFrom(cSphere).subtractInPlace(cLathe);
    let alpha = AngleFromToAround(proj, Axis.X, Axis.Y);
    RotateInPlace(proj, Axis.Y, alpha);

    let intersection = SphereWireIntersection(proj, rSphere, path, rWire);

    if (intersection.hit) {
        RotateInPlace(intersection.point!, Axis.Y, -alpha);
        RotateInPlace(intersection.normal!, Axis.Y, -alpha);
        intersection.point!.addInPlace(cLathe);
    }

    return intersection;
}

var SphereExtrudeIntersectionTmpWireProj_0 = { point: Vector3.Zero(), index: - 1, fraction: 0 };
var SphereExtrudeIntersectionTmpVec3 = Vector3.Zero();
var SphereExtrudeIntersectionTmpMatrix = Matrix.Identity();
export function SphereExtrudeIntersections(
    cSphere: Vector3,
    rSphere: number,
    extrudePath: Vector3[],
    extrudeNormals: Vector3[],
    shape: Vector3[],
    pathIsEvenlyDistributed?: boolean,
    nearBestIndex?: number,
    nearBestSearchRange?: number,
    excludePos?: Vector3,
    excludeRange_m?: number
): IIntersection[] {
    let pathProj = SphereExtrudeIntersectionTmpWireProj_0;
    ProjectPointOnPathToRef(cSphere, extrudePath, pathProj, pathIsEvenlyDistributed, nearBestIndex, nearBestSearchRange, excludePos, excludeRange_m);

    if (pathProj.point) {

    }
    
    if (pathProj.index >= 0 && pathProj.index < extrudePath.length) {
        let prev = extrudePath[pathProj.index - 1];
        let point = extrudePath[pathProj.index];
        let next = extrudePath[pathProj.index + 1];
        if (!prev) {
            prev = point;
        }
        if (!next) {
            next = point;
        }
        
        let prevN = extrudeNormals[pathProj.index - 1];
        let pointN = extrudeNormals[pathProj.index];
        let nextN = extrudeNormals[pathProj.index + 1];
        if (!prevN) {
            prevN = pointN;
        }
        if (!nextN) {
            nextN = pointN;
        }

        let zAxis = next.subtract(prev).normalize();
        let yAxis = pointN;
        //Vector3.SlerpToRef(prevN, nextN, frac, yAxis).normalize();
        let xAxis = SphereExtrudeIntersectionTmpVec3;
        Vector3.CrossToRef(yAxis, zAxis, xAxis);

        let matrix = SphereExtrudeIntersectionTmpMatrix;
        Matrix.FromXYZAxesToRef(xAxis, yAxis, zAxis, matrix);

        let dP = cSphere.subtract(pathProj.point);
        let localCSphere = new Vector3(Vector3.Dot(dP, xAxis), Vector3.Dot(dP, yAxis), Vector3.Dot(dP, zAxis));

        let intersections: IIntersection[] = [];

        for (let i = 0; i < shape.length - 1; i++) {
            let s1 = shape[i];
            let s2 = shape[i + 1];
            let proj = ProjectPointOnSegment(localCSphere, s1, s2);
            if (Vector3.DistanceSquared(localCSphere, proj) < rSphere * rSphere) {
                let intersection = new Intersection();
                intersection.hit = true;
                intersection.point = proj;
                intersection.normal = localCSphere.subtract(proj).normalize();
                intersection.depth = rSphere - Vector3.Distance(localCSphere, proj);
                intersections.push(intersection);
            }
        }

        intersections.forEach(intersection => {
            if (intersection && intersection.hit) {
                intersection.localPoint = intersection.point?.clone();
                if (intersection.normal) {
                    Vector3.TransformNormalToRef(intersection.normal, matrix, intersection.normal);
                }
                if (intersection.point) {
                    Vector3.TransformNormalToRef(intersection.point, matrix, intersection.point);
                    intersection.point.addInPlace(pathProj.point);
                }
            }
        });

        return intersections;
    }
    return [];
}

var SphereWireIntersectionTmpWireProj_0 = { point: Vector3.Zero(), index: -1 };
export function SphereWireIntersection(cSphere: Vector3, rSphere: number, path: Vector3[], rWire: number, pathIsEvenlyDistributed?: boolean, nearBestIndex?: number, nearBestSearchRange?: number, excludePos?: Vector3, excludeRange_m?: number): IIntersection {
    let intersection = new Intersection();

    let proj = SphereWireIntersectionTmpWireProj_0;
    ProjectPointOnPathToRef(cSphere, path, proj, pathIsEvenlyDistributed, nearBestIndex, nearBestSearchRange, excludePos, excludeRange_m);
    let sqrDist = Vector3.DistanceSquared(cSphere, proj.point);

    let sqrDepth = (rSphere + rWire) * (rSphere + rWire) - sqrDist;

    if (sqrDepth > 0) {
        intersection.hit = true;
        intersection.depth = rSphere + rWire - Math.sqrt(sqrDist);
        let dir = cSphere.subtract(proj.point).normalize();
        intersection.point = dir.scale(rWire);
        intersection.point.addInPlace(proj.point);
        intersection.normal = dir;
        intersection.index = proj.index;
    }

    return intersection;
}

var SphereInTubeIntersectionTmpWireProj_0 = { point: Vector3.Zero(), index: -1 };
export function SphereInTubeIntersection(cSphere: Vector3, rSphere: number, path: Vector3[], rTube: number, pathIsEvenlyDistributed?: boolean, nearBestIndex?: number, nearBestSearchRange?: number): IIntersection {
    let intersection = new Intersection();

    let proj = SphereInTubeIntersectionTmpWireProj_0;
    ProjectPointOnPathToRef(cSphere, path, proj, pathIsEvenlyDistributed, nearBestIndex, nearBestSearchRange);
    let dist = Vector3.Distance(cSphere, proj.point);
    if (proj.index === 0) {
        let AB = path[1].subtract(path[0]);
        let AP = cSphere.subtract(path[0]);
        if (Vector3.Dot(AB, AP) < 0) {
            dist = 0;
        }
    } else if (proj.index === path.length - 2) {
        let AB = path[path.length - 1].subtract(path[path.length - 2]);
        let AP = cSphere.subtract(path[path.length - 1]);
        if (Vector3.Dot(AB, AP) > 0) {
            dist = 0;
        }
    }

    let depth = rSphere + dist - rTube;

    if (depth > 0 && depth < rSphere) {
        intersection.hit = true;
        intersection.depth = depth;
        let dir = proj.point.subtract(cSphere).normalize();
        intersection.point = dir.scale(-rTube);
        intersection.point.addInPlace(proj.point);
        intersection.normal = dir;
        intersection.index = proj.index;
    }

    return intersection;
}

var SphereTriangleIntersectionTmpVec3_0 = Vector3.Zero();
var SphereTriangleIntersectionTmpVec3_1 = Vector3.Zero();
var SphereTriangleIntersectionTmpVec3_2 = Vector3.Zero();
var SphereTriangleIntersectionTmpVec3_3 = Vector3.Zero();
var SphereTriangleIntersectionTmpVec3_4 = Vector3.Zero();
export function SphereTriangleIntersection(sphere: ISphere, p1: Vector3, p2: Vector3, p3: Vector3, smooth?: boolean): IIntersection;
export function SphereTriangleIntersection(cSphere: Vector3, rSphere: number, p1: Vector3, p2: Vector3, p3: Vector3, smooth?: boolean): IIntersection;
export function SphereTriangleIntersection(arg1: any, arg2: any, arg3: any, arg4: any, arg5?: any, arg6?: any): IIntersection {
    let intersection = new Intersection();

    let cSphere: Vector3;
    let rSphere: number;
    let p1: Vector3;
    let p2: Vector3;
    let p3: Vector3;
    let smooth: boolean;

    if (arg1 instanceof Vector3) {
        cSphere = arg1;
        rSphere = arg2;
        p1 = arg3;
        p2 = arg4;
        p3 = arg5;
        smooth = arg6;
    } else {
        cSphere = (arg1 as ISphere).center;
        rSphere = (arg1 as ISphere).radius;
        p1 = arg2;
        p2 = arg3;
        p3 = arg4;
        smooth = arg5;
    }

    if (SphereTriangleCheck(cSphere, rSphere, p1, p2, p3)) {
        let plane = PlaneCollider.CreateFromPoints(p1, p2, p3);
        let proj = ProjectPointOnPlaneToRef(cSphere, plane.point, plane.normal, SphereTriangleIntersectionTmpVec3_0);
        let sqrDist = Vector3.DistanceSquared(cSphere, proj);
        if (sqrDist <= rSphere * rSphere) {
            let barycentric = Barycentric(cSphere, p1, p2, p3);
            if (barycentric.x < 0 || barycentric.x > 1 || barycentric.y < 0 || barycentric.y > 1 || barycentric.z < 0 || barycentric.z > 1) {
                let proj1 = ProjectPointOnSegmentToRef(proj, p1, p2, SphereTriangleIntersectionTmpVec3_1);
                let sqrDist1 = Vector3.DistanceSquared(proj, proj1);
                let proj2 = ProjectPointOnSegmentToRef(proj, p2, p3, SphereTriangleIntersectionTmpVec3_2);
                let sqrDist2 = Vector3.DistanceSquared(proj, proj2);
                let proj3 = ProjectPointOnSegmentToRef(proj, p3, p1, SphereTriangleIntersectionTmpVec3_3);
                let sqrDist3 = Vector3.DistanceSquared(proj, proj3);

                if (sqrDist1 <= sqrDist2 && sqrDist1 <= sqrDist3) {
                    proj = proj1;
                } else if (sqrDist2 <= sqrDist1 && sqrDist2 <= sqrDist3) {
                    proj = proj2;
                } else if (sqrDist3 <= sqrDist1 && sqrDist3 <= sqrDist2) {
                    proj = proj3;
                }
            }

            sqrDist = Vector3.DistanceSquared(cSphere, proj);
            if (sqrDist <= rSphere * rSphere) {
                let triangleNormal = Vector3.CrossToRef(p3.subtract(p1), p2.subtract(p1), SphereTriangleIntersectionTmpVec3_4);
                let normal = cSphere.subtract(proj);
                if (Vector3.Dot(triangleNormal, normal) > 0) {
                    let dist = Math.sqrt(sqrDist);
                    intersection.hit = true;
                    intersection.point = proj.clone();
                    if (smooth) {
                        intersection.normal = normal.clone().normalize();
                    } else {
                        intersection.normal = triangleNormal.clone().normalize();
                    }
                    intersection.depth = rSphere - dist;
                }
            }
        }
    }

    return intersection;
}

var SphereMeshIntersectionTmpVec3_0 = Vector3.Zero();
var SphereMeshIntersectionTmpVec3_1 = Vector3.Zero();
var SphereMeshIntersectionTmpVec3_2 = Vector3.Zero();
var SphereMeshIntersectionTmpVec3_3 = Vector3.Zero();
var SphereMeshIntersectionTmpVec3_4 = Vector3.Zero();
var SphereMeshIntersectionTmpQuat_0 = Quaternion.Identity();
var SphereMeshIntersectionTmpMatrix_0 = Matrix.Identity();

export function SphereMeshIntersection(cSphere: Vector3, rSphere: number, mesh: AbstractMesh, smooth?: boolean): IIntersection {
    let intersection: IIntersection = new Intersection();

    let bbox = mesh.getBoundingInfo();
    let scale: Vector3 = SphereMeshIntersectionTmpVec3_0;
    mesh.getWorldMatrix().decompose(scale, SphereMeshIntersectionTmpQuat_0, SphereMeshIntersectionTmpVec3_1);

    let invMatrix = SphereMeshIntersectionTmpMatrix_0;
    invMatrix.copyFrom(mesh.getWorldMatrix()).invert();
    let localCSphere = Vector3.TransformCoordinates(cSphere, invMatrix);
    let localRadius = rSphere / scale.x;
    if (SphereAABBCheck(localCSphere, localRadius, bbox.minimum, bbox.maximum)) {
        let positions = mesh.getVerticesData(VertexBuffer.PositionKind)!;
        let indices = mesh.getIndices()!;
        let p1 = SphereMeshIntersectionTmpVec3_2;
        let p2 = SphereMeshIntersectionTmpVec3_3;
        let p3 = SphereMeshIntersectionTmpVec3_4;
        for (let i = 0; i < indices.length / 3; i++) {
            let i1 = indices[3 * i];
            let i2 = indices[3 * i + 1];
            let i3 = indices[3 * i + 2];

            p1.x = positions[3 * i1];
            p1.y = positions[3 * i1 + 1];
            p1.z = positions[3 * i1 + 2];
            p2.x = positions[3 * i2];
            p2.y = positions[3 * i2 + 1];
            p2.z = positions[3 * i2 + 2];
            p3.x = positions[3 * i3];
            p3.y = positions[3 * i3 + 1];
            p3.z = positions[3 * i3 + 2];

            let triIntersection = SphereTriangleIntersection(localCSphere, localRadius, p1, p2, p3, smooth);
            if (triIntersection.hit) {
                if (!intersection || triIntersection.depth > intersection.depth) {
                    intersection = triIntersection;
                }
            }
        }

        if (intersection.hit) {
            Vector3.TransformCoordinatesToRef(intersection.point!, mesh.getWorldMatrix(), intersection.point!);
            Vector3.TransformNormalToRef(intersection.normal!, mesh.getWorldMatrix(), intersection.normal!);
        }
    }
    return intersection;
}
