import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Ray } from "@babylonjs/core/Culling/ray";

var TmpVec3 = [Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero()];

var TmpQuat = [Quaternion.Identity()];

export function IsFinite(v: Vector3): boolean {
    return v && isFinite(v.x) && isFinite(v.y) && isFinite(v.z);
}

export function Barycentric(point: Vector3, p1: Vector3, p2: Vector3, p3: Vector3): Vector3 {
    let v0 = p2.subtract(p1);
    let v1 = p3.subtract(p1);
    let v2 = point.subtract(p1);

    let d00 = Vector3.Dot(v0, v0);
    let d01 = Vector3.Dot(v0, v1);
    let d11 = Vector3.Dot(v1, v1);
    let d20 = Vector3.Dot(v2, v0);
    let d21 = Vector3.Dot(v2, v1);

    let d = d00 * d11 - d01 * d01;
    let v = (d11 * d20 - d01 * d21) / d;
    let w = (d00 * d21 - d01 * d20) / d;
    let u = 1 - v - w;

    return new Vector3(u, v, w);
}

export function ProjectPerpendicularAtToRef(v: Vector3, at: Vector3, out: Vector3): Vector3 {
    let k: number = v.x * at.x + v.y * at.y + v.z * at.z;
    k = k / (at.x * at.x + at.y * at.y + at.z * at.z);
    out.copyFrom(v);
    out.subtractInPlace(at.multiplyByFloats(k, k, k));
    return out;
}

export function ProjectPerpendicularAt(v: Vector3, at: Vector3): Vector3 {
    let p = Vector3.Zero();
    ProjectPerpendicularAtToRef(v, at, p);
    return p;
}

export function Rotate(v: Vector3, axis: Vector3, angle: number): Vector3 {
    let rotatedV = Vector3.Zero();
    return RotateToRef(v, axis, angle, rotatedV);
}

export function RotateToRef(v: Vector3, axis: Vector3, angle: number, ref: Vector3): Vector3 {
    Quaternion.RotationAxisToRef(axis, angle, TmpQuat[0]);
    return v.rotateByQuaternionToRef(TmpQuat[0], ref);
}

export function RotateInPlace(v: Vector3, axis: Vector3, angle: number): Vector3 {
    return RotateToRef(v, axis, angle, v);
}

export function Angle(from: Vector3, to: Vector3): number {
    let pFrom = TmpVec3[0].copyFrom(from).normalize();
    let pTo = TmpVec3[1].copyFrom(to).normalize();
    let angle: number = Math.acos(Vector3.Dot(pFrom, pTo));
    return angle;
}

export function AngleFromToAround(from: Vector3, to: Vector3, around: Vector3): number {
    let pFrom = TmpVec3[0];
    let pTo = TmpVec3[1];
    ProjectPerpendicularAtToRef(from, around, pFrom).normalize();
    ProjectPerpendicularAtToRef(to, around, pTo).normalize();
    let dot = Vector3.Dot(pFrom, pTo);
    dot = Math.min(Math.max(dot, -1), 1);
    let angle: number = Math.acos(dot);
    if (angle > Math.PI / 360 / 60) {
        Vector3.CrossToRef(pFrom, pTo, TmpVec3[2]);
        if (Vector3.Dot(TmpVec3[2], around) < 0) {
            angle = -angle;
        }
    }
    return angle;
}

export function ProjectPointOnPlaneToRef(point: Vector3, pPlane: Vector3, nPlane: Vector3, ref: Vector3): Vector3 {
    ref.copyFrom(point).subtractInPlace(pPlane);
    let dot = Vector3.Dot(ref, nPlane);
    ref.copyFrom(nPlane).scaleInPlace(-dot);
    ref.addInPlace(point);
    return ref;
}

export function ProjectPointOnPlane(point: Vector3, pPlane: Vector3, nPlane: Vector3): Vector3 {
    let proj = Vector3.Zero();
    ProjectPointOnPlaneToRef(point, pPlane, nPlane, proj);
    return proj;
}

export function DistancePointRay(point: Vector3, origin: Vector3, direction: Vector3): number;
export function DistancePointRay(point: Vector3, ray: Ray): number;
export function DistancePointRay(point: Vector3, a: Ray | Vector3, direction?: Vector3): number {
    let origin: Vector3;
    if (a instanceof Ray) {
        origin = a.origin;
        direction = a.direction;
    } else {
        origin = a;
    }
    let PA = TmpVec3[0];
    let dir = TmpVec3[1];
    let cross = TmpVec3[2];
    PA.copyFrom(origin).subtractInPlace(point);
    if (direction) {
        dir.copyFrom(direction).normalize();
    }
    Vector3.CrossToRef(PA, dir, cross);
    return cross.length();
}

export function DistancePointLine(point: Vector3, lineA: Vector3, lineB: Vector3): number {
    let PA = TmpVec3[0];
    let dir = TmpVec3[1];
    let cross = TmpVec3[2];
    PA.copyFrom(lineA).subtractInPlace(point);
    dir.copyFrom(lineB).subtractInPlace(lineA).normalize();
    Vector3.CrossToRef(PA, dir, cross);
    return cross.length();
}

export function ProjectPointOnLineToRef(point: Vector3, lineA: Vector3, lineB: Vector3, ref: Vector3): Vector3 {
    let AP = TmpVec3[0];
    let dir = TmpVec3[1];
    AP.copyFrom(point).subtractInPlace(lineA);
    dir.copyFrom(lineB).subtractInPlace(lineA);
    let l = dir.length();
    dir.scaleInPlace(1 / l);
    let dist = Vector3.Dot(AP, dir);
    ref.copyFrom(dir).scaleInPlace(dist).addInPlace(lineA);
    return ref;
}

export function ProjectPointOnLine(point: Vector3, lineA: Vector3, lineB: Vector3): Vector3 {
    let proj = Vector3.Zero();
    ProjectPointOnLineToRef(point, lineA, lineB, proj);
    return proj;
}

export function ProjectPointOnSegmentToRef(point: Vector3, segA: Vector3, segB: Vector3, ref: Vector3): Vector3 {
    let AP = TmpVec3[0];
    let dir = TmpVec3[1];
    AP.copyFrom(point).subtractInPlace(segA);
    dir.copyFrom(segB).subtractInPlace(segA);
    let l = dir.length();
    dir.scaleInPlace(1 / l);
    let dist = Vector3.Dot(AP, dir);
    dist = Math.max(Math.min(dist, l), 0);
    ref.copyFrom(dir).scaleInPlace(dist).addInPlace(segA);

    return ref;
}

export function ProjectPointOnSegment(point: Vector3, segA: Vector3, segB: Vector3): Vector3 {
    let proj = Vector3.Zero();
    ProjectPointOnSegmentToRef(point, segA, segB, proj);
    return proj;
}

export function DistancePointSegment(point: Vector3, segA: Vector3, segB: Vector3): number {
    let AP = TmpVec3[0];
    let dir = TmpVec3[1];
    let projP = TmpVec3[2];
    AP.copyFrom(point).subtractInPlace(segA);
    dir.copyFrom(segB).subtractInPlace(segA);
    let l = dir.length();
    dir.scaleInPlace(1 / l);
    let dist = Vector3.Dot(AP, dir);
    dist = Math.max(Math.min(dist, l), 0);
    projP.copyFrom(dir).scaleInPlace(dist).addInPlace(segA);
    let PprojP = projP.subtractInPlace(point);
    return PprojP.length();
}

export interface IPathProjection {
    point: Vector3;
    index: number;
}
export function ProjectPointOnPathToRef(point: Vector3, path: Vector3[], ref: IPathProjection, pathIsEvenlyDistributed?: boolean, nearBestIndex: number = -1, nearBestSearchRange: number = 32, excludePos?: Vector3, excludeRange_m: number = 1): IPathProjection {
    let proj = TmpVec3[3];

    if (pathIsEvenlyDistributed && path.length >= 4) {
        let bestIndex = -1;
        let bestSqrDist = Infinity;
        let start: number;
        let end: number;
        if (nearBestIndex >= 0) {
            start = Math.min(Math.max(nearBestIndex - nearBestSearchRange), 0, path.length);
            end = Math.min(Math.max(nearBestIndex + nearBestSearchRange), 0, path.length);
        } else {
            start = 0;
            end = path.length;
        }
        for (let i = start; i < end; i++) {
            let sqrDist = Vector3.DistanceSquared(point, path[i]);
            if (excludePos) {
                if (Vector3.DistanceSquared(path[i], excludePos) < excludeRange_m * excludeRange_m) {
                    sqrDist = Infinity;
                }
            }
            if (sqrDist < bestSqrDist) {
                bestIndex = i;
                bestSqrDist = sqrDist;
            }
        }

        let iFirst = Math.max(0, bestIndex - 1);
        let iLast = Math.min(path.length - 1, bestIndex + 1);
        bestSqrDist = Infinity;
        for (let i = iFirst; i < iLast; i++) {
            ProjectPointOnSegmentToRef(point, path[i], path[i + 1], proj);
            let sqrDist = Vector3.DistanceSquared(point, proj);
            if (sqrDist < bestSqrDist) {
                ref.point.copyFrom(proj);
                ref.index = i;
                bestSqrDist = sqrDist;
            }
        }
    } else {
        let bestSqrDist = Infinity;
        for (let i = 0; i < path.length - 1; i++) {
            ProjectPointOnSegmentToRef(point, path[i], path[i + 1], proj);
            let sqrDist = Vector3.DistanceSquared(point, proj);
            if (excludePos) {
                if (Vector3.DistanceSquared(proj, excludePos) < excludeRange_m * excludeRange_m) {
                    sqrDist = Infinity;
                }
            }
            if (sqrDist < bestSqrDist) {
                ref.point.copyFrom(proj);
                ref.index = i;
                bestSqrDist = sqrDist;
            }
        }
    }

    return ref;
}

export function StepToRef(from: Vector3, to: Vector3, step: number, ref: Vector3): Vector3 {
    from = TmpVec3[0].copyFrom(from);
    let sqrStep = step * step;
    if (Vector3.DistanceSquared(from, to) < sqrStep) {
        ref.copyFrom(to);
    } else {
        ref.copyFrom(to).subtractInPlace(from).normalize().scaleInPlace(step).addInPlace(from);
    }

    return ref;
}

export function StepVec3(from: Vector3, to: Vector3, step: number): Vector3 {
    let v = Vector3.Zero();
    StepToRef(from, to, step, v);
    return v;
}

export function ForceDistanceFromOriginInPlace(point: Vector3, origin: Vector3, distance: number): Vector3 {
    TmpVec3[0].copyFrom(point).subtractInPlace(origin).normalize().scaleInPlace(distance);
    point.copyFrom(origin).addInPlace(TmpVec3[0]);
    return point;
}

export function GetPathLength(path: Vector3[]): number {
    let l = 0;
    for (let i = 0; i < path.length - 1; i++) {
        let p0 = path[i];
        let p1 = path[i + 1];
        l += Vector3.Distance(p0, p1);
    }
    return l;
}

export function EvaluatePathToRef(f: number, path: Vector3[], ref: Vector3): Vector3 {
    if (f === 1) {
        return path[path.length - 1].clone();
    }
    let n = Math.floor(f * (path.length - 1));
    let ff = f * (path.length - 1) - n;
    TmpVec3[0].copyFrom(path[n]).scaleInPlace(1 - ff);
    ref.copyFrom(path[n + 1])
        .scaleInPlace(ff)
        .addInPlace(TmpVec3[0]);
    return ref;
}

export function EvaluatePath(f: number, path: Vector3[]): Vector3 {
    let v = Vector3.Zero();
    EvaluatePathToRef(f, path, v);
    return v;
}

export function EvaluatePathTangentToRef(f: number, path: Vector3[], ref: Vector3): Vector3 {
    if (f === 1) {
        return path[path.length - 1].subtract(path[path.length - 2]).normalize();
    }
    let n = Math.floor(f * (path.length - 1));
    let p = path[n];
    let prev = path[n - 1] ? path[n - 1] : p;
    let next = path[n + 1] ? path[n + 1] : p;
    let nextNext = path[n + 2] ? path[n + 2] : next;
    let ff = f * (path.length - 1) - n;
    let dir0 = TmpVec3[1].copyFrom(next).subtractInPlace(prev).normalize();
    let dir1 = TmpVec3[2].copyFrom(nextNext).subtractInPlace(p).normalize();
    TmpVec3[0].copyFrom(dir0).scaleInPlace(1 - ff);
    ref.copyFrom(dir1).scaleInPlace(ff).addInPlace(TmpVec3[0]);
    return ref;
}

export function EvaluatePathTangent(f: number, path: Vector3[]): Vector3 {
    let v = Vector3.Zero();
    EvaluatePathTangentToRef(f, path, v);
    return v;
}

export function CatmullRomPathInPlace(path: Vector3[], inDir?: Vector3, outDir?: Vector3): Vector3[] {
    if (path.length >= 2) {
        let pFirst = TmpVec3[0];
        if (inDir) {
            pFirst.copyFrom(inDir).scaleInPlace(Vector3.Distance(path[0], path[1])).scaleInPlace(-1).addInPlace(path[0]);
        } else {
            pFirst.copyFrom(path[0]).subtractInPlace(path[1]);
            pFirst.addInPlace(path[0]);
        }

        let pLast = TmpVec3[1];
        if (outDir) {
            pLast
                .copyFrom(outDir)
                .scaleInPlace(Vector3.Distance(path[path.length - 2], path[path.length - 1]))
                .addInPlace(path[path.length - 1]);
        } else {
            pLast.copyFrom(path[path.length - 1]).subtractInPlace(path[path.length - 2]);
            pLast.addInPlace(path[path.length - 1]);
        }

        let interpolatedPoints: Vector3[] = [];
        for (let i: number = 0; i < path.length - 1; i++) {
            let p0 = i > 0 ? path[i - 1] : pFirst;
            let p1 = path[i];
            let p2 = path[i + 1];
            let p3 = i < path.length - 2 ? path[i + 2] : pLast;
            interpolatedPoints.push(Vector3.CatmullRom(p0, p1, p2, p3, 0.5));
        }
        for (let i: number = 0; i < interpolatedPoints.length; i++) {
            path.splice(2 * i + 1, 0, interpolatedPoints[i]);
        }
    }
    return path;
}

export function SmoothPathInPlace(path: Vector3[], f: number): Vector3[] {
    let clone = path.map((p) => {
        return p.clone();
    });

    let l = path.length;
    for (let i = 1; i < l - 1; i++) {
        let x = (path[i - 1].x + path[i].x * (1 - f) + path[i + 1].x) / (3 - f);
        let y = (path[i - 1].y + path[i].y * (1 - f) + path[i + 1].y) / (3 - f);
        let z = (path[i - 1].z + path[i].z * (1 - f) + path[i + 1].z) / (3 - f);
        clone[i].copyFromFloats(x, y, z);
    }

    for (let i = 0; i < l; i++) {
        path[i].copyFrom(clone[i]);
    }

    return path;
}

export function BevelClosedPath(path: Vector3[], bevel: number): Vector3[] {
    let beveledPath: Vector3[] = [];

    for (let i: number = 0; i < path.length; i++) {
        let pPrev = path[(i - 1 + path.length) % path.length];
        let p = path[i];
        let pNext = path[(i + 1) % path.length];
        let dPrev = pPrev.subtract(p).normalize();
        dPrev.scaleInPlace(bevel);
        let dNext = pNext.subtract(p).normalize();
        dNext.scaleInPlace(bevel);

        beveledPath.push(p.add(dPrev));
        beveledPath.push(p.add(dNext));
    }

    return beveledPath;
}

export function CatmullRomClosedPathInPlace(path: Vector3[]): Vector3[] {
    let interpolatedPoints: Vector3[] = [];
    for (let i: number = 0; i < path.length; i++) {
        let p0 = path[(i - 1 + path.length) % path.length];
        let p1 = path[i];
        let p2 = path[(i + 1) % path.length];
        let p3 = path[(i + 2) % path.length];
        interpolatedPoints.push(Vector3.CatmullRom(p0, p1, p2, p3, 0.5));
    }
    for (let i: number = 0; i < interpolatedPoints.length; i++) {
        path.splice(2 * i + 1, 0, interpolatedPoints[i]);
    }
    return path;
}

export function DecimatePathInPlaceFast(path: Vector3[], minAngle: number = (1 / 180) * Math.PI, collateral?: Vector3[]): Vector3[] {
    let done = false;
    while (!done) {
        done = true;
        let dirPrev = Vector3.Forward();
        let dirNext = path[1].subtract(path[0]).normalize();
        for (let i = 1; i < path.length - 1; i++) {
            dirPrev.copyFrom(dirNext);
            dirNext
                .copyFrom(path[i + 1])
                .subtractInPlace(path[i])
                .normalize();
            let angle = Angle(dirPrev, dirNext);
            if (angle < minAngle) {
                path.splice(i, 1);
                if (collateral) {
                    collateral.splice(i, 1);
                }
                i += 2;
                done = false;
            }
        }
    }
    return path;
}

export function DecimatePathInPlace(path: Vector3[], minAngle: number = (1 / 180) * Math.PI, collateral?: Vector3[]): Vector3[] {
    let done = false;
    while (!done) {
        let flatestAngle = Infinity;
        let flatestIndex = -1;
        let dirPrev = Vector3.Forward();
        let dirNext = path[1].subtract(path[0]).normalize();
        for (let i = 1; i < path.length - 1; i++) {
            dirPrev.copyFrom(dirNext);
            dirNext
                .copyFrom(path[i + 1])
                .subtractInPlace(path[i])
                .normalize();
            let angle = Angle(dirPrev, dirNext);
            if (angle < minAngle && angle < flatestAngle) {
                flatestAngle = angle;
                flatestIndex = i;
            }
        }
        if (flatestIndex != -1) {
            path.splice(flatestIndex, 1);
            if (collateral) {
                collateral.splice(flatestIndex, 1);
            }
        } else {
            done = true;
        }
    }
    return path;
}

export function RemoveFromStartForDistanceInPlace(path: Vector3[], distance: number, outRemovedPart?: Vector3[]): Vector3[] {
    if (!outRemovedPart) {
        outRemovedPart = [];
    }
    let distanceLeft = distance;
    while (distanceLeft > 0 && path.length >= 2) {
        let pA = path[0];
        let pB = path[1];

        let d = Vector3.Distance(pA, pB);
        if (d <= distanceLeft) {
            outRemovedPart.push(path[0]);
            path.splice(0, 1);
            distanceLeft -= d;
        } else if (d > distanceLeft) {
            let newPoint = pB.subtract(pA).normalize().scaleInPlace(distanceLeft).addInPlace(pA);
            outRemovedPart.push(path[0]);
            outRemovedPart.push(newPoint);
            path[0] = newPoint;
            distanceLeft = 0;
        }
    }

    return path;
}

export function RemoveFromEndForDistanceInPlace(path: Vector3[], distance: number, outRemovedPart?: Vector3[]): Vector3[] {
    if (!outRemovedPart) {
        outRemovedPart = [];
    }
    path.reverse();
    RemoveFromStartForDistanceInPlace(path, distance, outRemovedPart);
    path.reverse();
    outRemovedPart.reverse();
    return path;
}

export function RandomInSphereCutToRef(dir: Vector3, alphaMin: number, alphaMax: number, betaMin: number, betaMax: number, up: Vector3 | undefined, ref: Vector3): Vector3 {
    if (!up) {
        up = Axis.Y;
    }
    let right = Vector3.CrossToRef(up, dir, TmpVec3[0]).normalize();
    up = Vector3.CrossToRef(dir, right, TmpVec3[1]).normalize();
    let a = Math.random() * (alphaMax - alphaMin) + alphaMin;
    let b = Math.random() * (betaMax - betaMin) + betaMin;
    RotateToRef(dir, right, b, ref);
    RotateToRef(ref, up, a, ref);
    return ref;
}

export function RandomInSphereCut(dir: Vector3, alphaMin: number, alphaMax: number, betaMin: number, betaMax: number, up?: Vector3): Vector3 {
    let v = Vector3.Zero();
    RandomInSphereCutToRef(dir, alphaMin, alphaMax, betaMin, betaMax, up, v);
    return v;
}

export function GetClosestAxisToRef(dir: Vector3, ref: Vector3): Vector3 {
    let X = Math.abs(dir.x);
    let Y = Math.abs(dir.y);
    let Z = Math.abs(dir.z);
    if (X >= Y && X >= Z) {
        if (dir.x >= 0) {
            ref.copyFromFloats(1, 0, 0);
        } else {
            ref.copyFromFloats(-1, 0, 0);
        }
    } else if (Y >= X && Y >= Z) {
        if (dir.y >= 0) {
            ref.copyFromFloats(0, 1, 0);
        } else {
            ref.copyFromFloats(0, -1, 0);
        }
    } else if (Z >= X && Z >= Y) {
        if (dir.z >= 0) {
            ref.copyFromFloats(0, 0, 1);
        } else {
            ref.copyFromFloats(0, 0, -1);
        }
    }
    return ref;
}

export function GetClosestAxis(dir: Vector3): Vector3 {
    let v = Vector3.Zero();
    GetClosestAxisToRef(dir, v);
    return v;
}
