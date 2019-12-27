/*
 * This program source code file is part of kicad-utils
 * Copyright (C) 2017 cho45 <cho45@lowreal.net>.
 *
 * And this program source code file is imported from KiCad, a free EDA CAD application.
 *
 * Original Author Copyright:
 *
 * Copyright (C) 2015 Jean-Pierre Charras, jaen-pierre.charras@gipsa-lab.inpg.com
 * Copyright (C) 1992-2017 KiCad Developers, see KiCAD AUTHORS.txt for contributors.
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, you may find one here:
 * http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * or you may search the http://www.gnu.org website for the version 2 license,
 * or you may write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA
 */

/**
 * KiCAD internal unit:
 *	length: mil (1/1000 inch)
 *	angles: decidegree (1/10 degrees)
 */

export function DECIDEG2RAD(deg: number): number {
	return deg * Math.PI / 1800;
}

export function RAD2DECIDEG(rad: number): number {
	return rad * 1800 / Math.PI;
}

export function NORMALIZE_ANGLE_POS(angle: number): number {
	while ( angle < 0 ) angle += 3600;
	while ( angle >= 3600 ) angle -= 3600;
	return angle;
}

export function AddAngles(angle1: number, angle2: number): number {
	return NORMALIZE_ANGLE_POS(angle1 + angle2);
}

export function ArcTangente(dy: number , dx: number): number {
	if ( dx == 0 && dy == 0 ) return 0;

	if ( dy == 0 ) {
		if ( dx >= 0 )
			return 0;
		else
			return -1800;
	}

	if ( dx == 0 ) {
		if ( dy >= 0 )
			return 900;
		else
			return -900;
	}

	if( dx == dy ) {
		if ( dx >= 0 )
			return 450;
		else
			return -1800 + 450;
	}

	if( dx == -dy ) {
		if ( dx >= 0 )
			return -450;
		else
			return 1800 - 450;
	}

	return RAD2DECIDEG( Math.atan2( dy, dx ) );
}

export function EuclideanNorm(v: Size | Point) {
	if (v instanceof Size) {
		return Math.hypot(v.width, v.height);
	} else {
		return Math.hypot(v.x, v.y);
	}
}

export function GetLineLength(p1: Point, p2: Point) {
	return Math.hypot(
		p1.x - p2.x,
		p1.y - p2.y
	);
}

export function RotatePoint(p: Point, angle: number): Point {
	angle = NORMALIZE_ANGLE_POS(angle);
	if (angle === 0) {
		return p;
	}
	if ( angle === 900 ) {        /* sin = 1, cos = 0 */
		[p.x, p.y] = [p.y, -p.x]
	} else
	if ( angle == 1800 ) {  /* sin = 0, cos = -1 */
		[p.x, p.y] = [-p.x, -p.y]
	} else
	if ( angle == 2700 ) {  /* sin = -1, cos = 0 */
		[p.x, p.y] = [-p.y, p.x]
	} else {
		const fangle = DECIDEG2RAD( angle );
		const sinus = Math.sin( fangle );
		const cosinus = Math.cos( fangle );
		const rx = (p.y * sinus ) + (p.x * cosinus );
		const ry = (p.y * cosinus ) - (p.x * sinus );
		p.x = rx; p.y = ry;
	}
	return p;
}

export function RotatePointWithCenter(p: Point, center: Point, angle: number): Point {
	const t = {
		x: p.x - center.x,
		y: p.y - center.y,
	}
	RotatePoint(t, angle);

	p.x = t.x + center.x;
	p.y = t.y + center.y;
	return p;
}

export function MM2MIL(mm: number) {
	return mm / 0.0254;
}

export function MIL2MM(mil: number) {
	return mil * 0.0254;
}

export function ReadDelimitedText(s: string): string {
	const match = s.match(/"((?:\\"|[^"])+)"/);
	if (!match) return "";
	const inner = match[1];
	return inner.replace(/\\([\\"])/g, (_, c) => c);
}

export function Clamp(lower: number, value: number, upper: number) {
	if (value < lower) return lower;
	if (upper < value) return upper;
	return value;
}

export class Transform {
	constructor(
		public x1:number = 1,
		public x2:number = 0,
		public y1:number = 0,
		public y2:number = -1,
		public tx:number = 0,
		public ty:number = 0
	) {
	}

	// default in KiCAD
	static default() {
		return new Transform(
			 1,  0,
			 0, -1,
			 0,  0
		);
	}

	static identify() {
		return new Transform(
			1, 0,
			0, 1,
			0, 0
		);
	}

	static translate(tx: number, ty: number) {
		return new Transform(
			1, 0,
			0, 1,
			tx, ty
		);
	}

	static scale(sx:number, sy: number) {
		return new Transform(
			sx, 0,
			0, sy,
			0,  0
		);
	}

	static rotate(radian: number) {
		const s = Math.sin(radian);
		const c = Math.cos(radian);
		return new Transform(
			 c,  s,
			-s,  c,
			 0,  0
		);
	}

	clone() {
		return new Transform(
			this.x1, this.x2,
			this.y1, this.y2,
			this.tx, this.ty
		);
	}

	translate(tx: number, ty: number) {
		return Transform.translate(tx, ty).multiply(this);
	}

	scale(sx: number, sy: number) {
		// only supports same xy ratio
		if (Math.abs(sx) !== Math.abs(sy)) {
			throw "invalid scale ratio";
		}
		return Transform.scale(sx, sy).multiply(this);
	}

	rotate(radian: number) {
		return Transform.rotate(radian).multiply(this);
	}

	multiply(b: Transform): Transform {
		const a = this;

		return new Transform(
			a.x1 * b.x1 + a.x2 * b.y1,
			a.x1 * b.x2 + a.x2 * b.y2,

			a.y1 * b.x1 + a.y2 * b.y1,
			a.y1 * b.x2 + a.y2 * b.y2,

			a.tx * b.x1 + a.ty * b.y1 + b.tx,
			a.tx * b.x2 + a.ty * b.y2 + b.ty,
		);
	}

	transformCoordinate(p: Point): Point {
		const x = (this.x1 * p.x + this.y1 * p.y) + this.tx;
		const y = (this.x2 * p.x + this.y2 * p.y) + this.ty;
		return new Point(x, y);
	}

	transformScalar(n: number): number {
		return (Math.abs(n * this.x1) + Math.abs(n * this.x2) + Math.abs(n * this.y1) + Math.abs(n * this.y2)) / 2;
	}

	mapAngles(angle1: number, angle2: number): Array<number> {
		let angle, delta;
		let x, y, t;
		let swap = 0;

		delta = angle2 - angle1;
		if( delta >= 1800 )
		{
			angle1 -= 1;
			angle2 += 1;
		}

		x = Math.cos( DECIDEG2RAD( angle1 ) );
		y = Math.sin( DECIDEG2RAD( angle1 ) );
		t = x * this.x1 + y * this.y1;
		y = x * this.x2 + y * this.y2;
		x = t;
		angle1 = Math.round( RAD2DECIDEG( Math.atan2( y, x ) ) );

		x = Math.cos( DECIDEG2RAD( angle2 ) );
		y = Math.sin( DECIDEG2RAD( angle2 ) );
		t = x * this.x1 + y * this.y1;
		y = x * this.x2 + y * this.y2;
		x = t;
		angle2 = Math.round( RAD2DECIDEG( Math.atan2( y, x ) ) );

		angle1 = NORMALIZE_ANGLE_POS( angle1 );
		angle2 = NORMALIZE_ANGLE_POS( angle2 );
		if( angle2 < angle1 )
			angle2 += 3600;

		if( angle2 - angle1 > 1800 ) // Need to swap the two angles
		{
			angle   = (angle1);
			angle1 = (angle2);
			angle2 = angle;

			angle1 = NORMALIZE_ANGLE_POS( angle1 );
			angle2 = NORMALIZE_ANGLE_POS( angle2 );
			if( angle2 < angle1 )
				angle2 += 3600;
			swap = 1;
		}

		if( delta >= 1800 )
		{
			angle1 += 1;
			angle2 -= 1;
		}

		return [angle1, angle2, swap];
	}
}

export class Point {
	x: number;
	y: number;

	constructor(x: number = 0, y: number = 0) {
		this.x = x;
		this.y = y;
	}

	static from(p: Point) {
		return new Point(
			p.x,
			p.y
		);
	}

	static add(p1: Point, p2: Point): Point {
		return {
			x: p1.x + p2.x,
			y: p1.y + p2.y,
		};
	}

	static sub(p1: Point, p2: Point): Point {
		return {
			x: p1.x - p2.x,
			y: p1.y - p2.y,
		};
	}

	static isZero(p: Point): boolean {
		return p.x === 0 && p.y === 0;
	}
}

export class Rect {
	pos1: Point;
	pos2: Point;

	constructor(pos1x: number, pos1y: number, pos2x: number, pos2y: number) {
		this.pos1 = new Point(pos1x, pos1y);
		this.pos2 = new Point(pos2x, pos2y);
	}

	get width(): number {
		return this.getWidth();
	}

	get height(): number {
		return this.getHeight();
	}

	getWidth(): number {
		return this.pos2.x - this.pos1.x;
	}

	getHeight(): number {
		return this.pos2.y - this.pos1.y;
	}

	normalize(): this {
		[
			this.pos1.x,
			this.pos1.y,
			this.pos2.x,
			this.pos2.y,
		] = [
			Math.min(this.pos1.x, this.pos2.x),
			Math.min(this.pos1.y, this.pos2.y),
			Math.max(this.pos1.x, this.pos2.x),
			Math.max(this.pos1.y, this.pos2.y),
		]
		return this;
	}

	merge(o: Rect): Rect {
		return new Rect(
			Math.min(this.pos1.x, o.pos1.x, this.pos2.x, o.pos2.x),
			Math.min(this.pos1.y, o.pos1.y, this.pos2.y, o.pos2.y),
			Math.max(this.pos1.x, o.pos1.x, this.pos2.x, o.pos2.x),
			Math.max(this.pos1.y, o.pos1.y, this.pos2.y, o.pos2.y),
		);
	}

	inflate(n: number): this {
		this.pos1.x -= n;
		this.pos1.y -= n;
		this.pos2.x += n;
		this.pos2.y += n;
		return this;
	}
}

export class Color {
	r: number;
	g: number;
	b: number;
	a: number;

	// common/colors.cpp 
	static BLACK =         new Color(0    , 0   , 0    );
	static DARKDARKGRAY =  new Color(72   , 72  , 72    );
	static DARKGRAY =      new Color(132  , 132 , 132    );
	static LIGHTGRAY =     new Color(194  , 194 , 194    );
	static WHITE =         new Color(255  , 255 , 255    );
	static LIGHTYELLOW =   new Color(255  , 255 , 194    );
	static DARKBLUE =      new Color(0    , 0   , 72   );
	static DARKGREEN =     new Color(0    , 72  , 0    );
	static DARKCYAN =      new Color(0    , 72  , 72   );
	static DARKRED =       new Color(72   , 0   , 0     );
	static DARKMAGENTA =   new Color(72   , 0   , 72    );
	static DARKBROWN =     new Color(72   , 72  , 0     );
	static BLUE =          new Color(0    , 0   , 132  );
	static GREEN =         new Color(0    , 132 , 0    );
	static CYAN =          new Color(0    , 132 , 132  );
	static RED =           new Color(132  , 0   , 0      );
	static MAGENTA =       new Color(132  , 0   , 132    );
	static BROWN =         new Color(132  , 132 , 0      );
	static LIGHTBLUE =     new Color(0    , 0   , 194  );
	static LIGHTGREEN =    new Color(0    , 194 , 0    );
	static LIGHTCYAN =     new Color(0    , 194 , 194  );
	static LIGHTRED =      new Color(194  , 0   , 0      );
	static LIGHTMAGENTA =  new Color(194  , 0   , 194    );
	static YELLOW =        new Color(194  , 194 , 0      );
	static PUREBLUE =      new Color(0    , 0   , 255  );
	static PUREGREEN =     new Color(0    , 255 , 0    );
	static PURECYAN =      new Color(0    , 255 , 255  );
	static PURERED =       new Color(255  , 0   , 0      );
	static PUREMAGENTA =   new Color(255  , 0   , 255    );
	static PUREYELLOW =    new Color(255  , 255 , 0      );

	// max 255 int
	constructor(r: number, g: number, b:number, a:number=1.0) {
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
	}

	is(c: Color): boolean {
		return this.r === c.r && this.g === c.g && this.b === c.b && this.a === c.a;
	}

	toCSSColor(): string {
		return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
	}

	mix(c: Color): Color {
		return new Color(
			this.r | c.r,
			this.g | c.g,
			this.b | c.b,
			this.a * c.a,
		);
	}
}

export class ColorDefinition extends Color {
	static BLACK        = new ColorDefinition(Color.BLACK        , "Black"     , Color.DARKDARKGRAY      );
	static DARKDARKGRAY = new ColorDefinition(Color.DARKDARKGRAY , "Gray 1"    , Color.DARKGRAY          );
	static DARKGRAY     = new ColorDefinition(Color.DARKGRAY     , "Gray 2"    , Color.LIGHTGRAY         );
	static LIGHTGRAY    = new ColorDefinition(Color.LIGHTGRAY    , "Gray 3"    , Color.WHITE             );
	static WHITE        = new ColorDefinition(Color.WHITE        , "White"     , Color.WHITE             );
	static LIGHTYELLOW  = new ColorDefinition(Color.LIGHTYELLOW  , "L.Yellow"  , Color.WHITE             );
	static DARKBLUE     = new ColorDefinition(Color.DARKBLUE     , "Blue 1"    , Color.BLUE              );
	static DARKGREEN    = new ColorDefinition(Color.DARKGREEN    , "Green 1"   , Color.GREEN             );
	static DARKCYAN     = new ColorDefinition(Color.DARKCYAN     , "Cyan 1"    , Color.CYAN              );
	static DARKRED      = new ColorDefinition(Color.DARKRED      , "Red 1"     , Color.RED               );
	static DARKMAGENTA  = new ColorDefinition(Color.DARKMAGENTA  , "Magenta 1" , Color.MAGENTA           );
	static DARKBROWN    = new ColorDefinition(Color.DARKBROWN    , "Brown 1"   , Color.BROWN             );
	static BLUE         = new ColorDefinition(Color.BLUE         , "Blue 2"    , Color.LIGHTBLUE         );
	static GREEN        = new ColorDefinition(Color.GREEN        , "Green 2"   , Color.LIGHTGREEN        );
	static CYAN         = new ColorDefinition(Color.CYAN         , "Cyan 2"    , Color.LIGHTCYAN         );
	static RED          = new ColorDefinition(Color.RED          , "Red 2"     , Color.LIGHTRED          );
	static MAGENTA      = new ColorDefinition(Color.MAGENTA      , "Magenta 2" , Color.LIGHTMAGENTA      );
	static BROWN        = new ColorDefinition(Color.BROWN        , "Brown 2"   , Color.YELLOW            );
	static LIGHTBLUE    = new ColorDefinition(Color.LIGHTBLUE    , "Blue 3"    , Color.PUREBLUE          );
	static LIGHTGREEN   = new ColorDefinition(Color.LIGHTGREEN   , "Green 3"   , Color.PUREGREEN         );
	static LIGHTCYAN    = new ColorDefinition(Color.LIGHTCYAN    , "Cyan 3"    , Color.PURECYAN          );
	static LIGHTRED     = new ColorDefinition(Color.LIGHTRED     , "Red 3"     , Color.PURERED           );
	static LIGHTMAGENTA = new ColorDefinition(Color.LIGHTMAGENTA , "Magenta 3" , Color.PUREMAGENTA       );
	static YELLOW       = new ColorDefinition(Color.YELLOW       , "Yellow 3"  , Color.PUREYELLOW        );
	static PUREBLUE     = new ColorDefinition(Color.PUREBLUE     , "Blue 4"    , Color.WHITE             );
	static PUREGREEN    = new ColorDefinition(Color.PUREGREEN    , "Green 4"   , Color.WHITE             );
	static PURECYAN     = new ColorDefinition(Color.PURECYAN     , "Cyan 4"    , Color.WHITE             );
	static PURERED      = new ColorDefinition(Color.PURERED      , "Red 4"     , Color.WHITE             );
	static PUREMAGENTA  = new ColorDefinition(Color.PUREMAGENTA  , "Magenta 4" , Color.WHITE             );
	static PUREYELLOW   = new ColorDefinition(Color.PUREYELLOW   , "Yellow 4"  , Color.WHITE             );


	name: string;
	light: Color;
	constructor(c: Color, name: string, light: Color) {
		super(c.r, c.g, c.b);
		this.name = name;
		this.light = light;
	}
}

export enum Fill {
	NO_FILL = "N",
	FILLED_SHAPE = "F",
	FILLED_WITH_BG_BODYCOLOR = "f",
}

export enum TextHjustify {
	LEFT = "L",
	CENTER = "C",
	RIGHT = "R",
}

export enum TextVjustify {
	TOP = "T",
	CENTER = "C",
	BOTTOM = "B",
}

export enum PinOrientation {
	RIGHT = "R",
	LEFT = "L",
	UP = "U",
	DOWN = "D",
}

export enum TextAngle {
	HORIZ = 0,
	VERT = 900,
}

export enum PinType {
	INPUT = "I",
	OUTPUT = "O",
	BIDI = "B",
	TRISTATE = "T",
	PASSIVE = "P",
	UNSPECIFIED = "U",
	POWER_IN = "W",
	POWER_OUT = "w",
	OPENCOLLECTOR = "C",
	OPENEMITTER = "E",
	NC = "N",
};

export enum PinAttribute {
	NONE            = "~",
	INVERTED        = "I",
	CLOCK           = "C",
	LOWLEVEL_IN     = "L",
	LOWLEVEL_OUT    = "V",
	FALLING_EDGE    = "F",
	NONLOGIC        = "X",
	INVISIBLE       = "N",
}

export enum SheetSide {
	RIGHT = "R",
	TOP = "T",
	BOTTOM = "B",
	LEFT = "L",
}

export enum Net {
	INPUT = "I",
	OUTPUT = "O",
	BIDI = "B",
	TRISTATE = "T",
	UNSPECIFIED = "U",
}

export class Size {
	static from(s: Size) {
		return new Size(s.width, s.height);
	}

	constructor(public width: number, public height: number) {
	}
}

export class PageInfo {
	pageType: string;
	width: number;
	height: number;
	portrait: boolean = false;

	static A4       = new PageInfo("A4"       , false , MM2MIL(297)  , MM2MIL(210));
	static A3       = new PageInfo("A3"       , false , MM2MIL(420)  , MM2MIL(297));
	static A2       = new PageInfo("A2"       , false , MM2MIL(594)  , MM2MIL(420));
	static A1       = new PageInfo("A1"       , false , MM2MIL(841)  , MM2MIL(594));
	static A0       = new PageInfo("A0"       , false , MM2MIL(1189) , MM2MIL(841));
	static A        = new PageInfo("A"        , false , 11000        , 8500);
	static B        = new PageInfo("B"        , false , 17000        , 11000);
	static C        = new PageInfo("C"        , false , 22000        , 17000);
	static D        = new PageInfo("D"        , false , 34000        , 22000);
	static E        = new PageInfo("E"        , false , 44000        , 34000);
	static GERBER   = new PageInfo("GERBER"   , false , 32000        , 32000);
	static User     = new PageInfo("User"     , false , 17000        , 11000);
	static USLetter = new PageInfo("USLetter" , false , 11000        , 8500);
	static USLegal  = new PageInfo("USLegal"  , false , 14000        , 8500);
	static USLedger = new PageInfo("USLedger" , false , 17000        , 11000);
	static PAGE_TYPES = [
		PageInfo.A4      ,
		PageInfo.A3      ,
		PageInfo.A2      ,
		PageInfo.A1      ,
		PageInfo.A0      ,
		PageInfo.A       ,
		PageInfo.B       ,
		PageInfo.C       ,
		PageInfo.D       ,
		PageInfo.E       ,
		PageInfo.GERBER  ,
		PageInfo.User    ,
		PageInfo.USLetter,
		PageInfo.USLegal ,
		PageInfo.USLedger,
	];

	constructor(pageType: string, portrait: boolean = false, width?: number, height?: number) {
		this.width = width || 0;
		this.height = height || 0;
		if (!width && !height) {
			this.setPageType(pageType);
		} else {
			this.pageType = pageType;
		}
		this.setPortrait(portrait);
	}

	setPageType(pageType: string) {
		const page = PageInfo.PAGE_TYPES.find((i) => i.pageType === pageType);
		Object.assign(this, page);
		this.pageType = pageType;
	}

	setPortrait(portrait: boolean) {
		if (this.portrait != portrait) {
			[this.width, this.height] = [this.height, this.width];
			this.portrait = portrait;
		}
	}
}

export class ElementMeta {
	type: string;
	layer: number;
	name: string;
	elemType: string;

	constructor(type: string, name: string, layer: number, elemType: string) {
		this.type = type;
		this.layer = layer;
		this.name = name;
		this.elemType = elemType
	}

	toString() {
		return `${this.type}-${this.elemType}-${this.name}-${this.layer}`
	}
}