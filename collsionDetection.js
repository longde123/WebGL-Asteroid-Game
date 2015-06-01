function getDistanceBetweenPoints(point1, point2){
    var x =   (point1[0]-point2[0])
    var y =   (point1[1]-point2[1])
    var z =   (point1[2]-point2[2])
    var dist = Math.sqrt(x*x + y*y + z*z);
    return dist;
}

function grabMidpoint(point1, point2){
    var x = (point1[0] + point2[0]) / 2;
    var y = (point1[1] + point2[1]) / 2;
    var z = (point1[2] + point2[2]) / 2;
    var midpoint = vec4( x, y , z, 1.0);
    return midpoint;
}

// 1 for object type is a square
// 2 is a asteroid should pass in center and radius
// 3 is the spaceship should pass in center and radius
// 4 is a missle should pass in a center and a radius
//right now only handles squares
function getBoundingSphere(objectVertices, objectType){
    var circle = []
    var radius = 0;
    var center = 0;
    if(objectType == 1){
        //need to find two diagonal points 
        //for now the 6th and the 24th spot in the array should be diagonal
        //calculate radius
        radius = getDistanceBetweenPoints(objectVertices[6], objectVertices[24]) / 2;
        radius = Math.abs(radius);
        radius -= .7;
        //calculate center
        center = grabMidpoint(objectVertices[6], objectVertices[24]);
    }
    if(objectType == 2 || objectType == 3 || objectType == 4){
        center = objectVertices[0];
        radius = objectVertices[1];
    }
    circle.push(center);
    circle.push(radius);
    return circle
}

// pass in each objects vertices and each objects type 
// 1 for object type is a square
// 2 is a asteroid should pass in center and radius
// 3 is the spaceship should pass in center and radius
// 4 is a missle should pass in a center and a radius
//right now only handles squares
function collisionDetection(object1_vertices, object1_type, object2_vertices, object2_type){
    var object1 = getBoundingSphere(object1_vertices, object1_type);
    var object2 = getBoundingSphere(object2_vertices, object2_type);
    var center1 = object1[0];
    var center2 = object2[0]; 
    var distance = getDistanceBetweenPoints(center1, center2);
    var radius1 = object1[1];
    var radius2 = object2[1];
    //console.log("center 1: " + object1 + "       center 2 : " + object2);
    //collision didn't occured
    if(distance > radius1 + radius2){
        return false;
    }
    else { //collision occured
        return true;
    }
}