//#!tsc && NODE_PATH=dist/src node dist/sketch3.js 
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
 *
 * IMPL is NOT COMPLETED!!
 */

import {
	AddAngles,
	ArcTangente,
	Clamp,
	Color,
	EuclideanNorm,
	Fill,
	GetLineLength,
	Point,
	RotatePoint,
	RotatePointWithCenter,
	Size,
    ElementMeta
} from "./kicad_common";

import {
	Board,
	Dimension,
	DrawSegment,
	EdgeModule,
	IsCopperLayer,
	LSET,
	Module,
	Pad,
	PadDrillShape,
	PadShape,
	PCB_LAYER_ID,
	Shape,
	Text,
	TextModule,
	Zone,
} from "./kicad_pcb";

import {Plotter,} from "./kicad_plotter";

const DEFAULT_LINE_WIDTH = 1;
const DEFAULT_LAYER_COLORS = [
	Color.RED,           Color.YELLOW,        Color.LIGHTMAGENTA,  Color.LIGHTRED,
	Color.CYAN,          Color.GREEN,         Color.BLUE,          Color.DARKGRAY,
	Color.MAGENTA,       Color.LIGHTGRAY,     Color.MAGENTA,       Color.RED,
	Color.BROWN,         Color.LIGHTGRAY,     Color.BLUE,          Color.GREEN,

	Color.RED,           Color.YELLOW,        Color.LIGHTMAGENTA,  Color.LIGHTRED,
	Color.CYAN,          Color.GREEN,         Color.BLUE,          Color.DARKGRAY,
	Color.MAGENTA,       Color.LIGHTGRAY,     Color.MAGENTA,       Color.RED,
	Color.BROWN,         Color.LIGHTGRAY,     Color.BLUE,          Color.GREEN,

	Color.BLUE,        Color.MAGENTA,
	Color.LIGHTCYAN,   Color.RED,
	Color.MAGENTA,     Color.CYAN,
	Color.BROWN,       Color.MAGENTA,
	Color.LIGHTGRAY,
	Color.BLUE,
	Color.GREEN,       Color.YELLOW,
	Color.YELLOW,
	Color.LIGHTMAGENTA,
	Color.YELLOW,
	Color.DARKGRAY
];

const LAYER_COLORS_DIFFING = [
	0,new Color(33, 33, 33),
	1,new Color(66, 66, 66),
	2,new Color(54, 54, 54),
	3,new Color(89, 89, 89),
	4,new Color(47, 47, 47),
	5,new Color(79, 77, 77),
	6,new Color(105, 105, 105),
	7,new Color(87, 87, 87),
	8,new Color(71, 71, 71),
	9, new Color(63, 63, 63),
	10,new Color(39, 39, 39),
	11, new Color(74, 74, 74),
	12, new Color(81, 81, 81),
	13, new Color(199, 199, 199),
	14, new Color(207, 198, 198),
	15, new Color(222, 222, 222),
	16,new Color(171, 164, 164),
	17, new Color(122, 118, 118),
	18, new Color(74, 71, 71),
	19, new Color(99, 96, 96),
	20, new Color(195, 195, 195),
	21, new Color(223, 223, 223),
	22, new Color(231, 231, 231),
	23, new Color(214, 214, 214),
	24, new Color(225, 225, 225),
	25, new Color(202, 202, 202),
	26, new Color(233, 233, 233),
	27, new Color(194, 194, 194),
	28, new Color(223, 223, 223),
	29, new Color(199, 199, 199),
	30, new Color(212, 212, 212),
	31,new Color(79, 79, 79),
	32, new Color(176, 176, 176),
	33, new Color(156, 156, 156),
	34, new Color(97, 97, 97),
	35, new Color(82, 82, 82),
	36, new Color(138, 138, 138),
	37, new Color(122, 122, 122),
	38, new Color(59, 59, 59),
	39, new Color(41, 41, 41),
	40, new Color(112, 112, 112),
	41, new Color(161, 161, 161),
	42, new Color(148, 148, 148),
	43, new Color(166, 166, 166),
	44, new Color(0, 0, 0),
	45, new Color(191, 191, 191),
	46,  new Color(128, 128, 128),
	47, new Color(112, 112, 112),
	48,new Color(177, 177, 177),
	49, new Color(196, 196, 196)
];

// pcbnew/plot_board_layers.cpp
// pcbnew/plot_brditems_plotter.cpp 
export class PCBPlotter {
	layerMask: LSET;
	plotOpt: PCBPlotOptions;
	layerColors: Map<number, Color>

	constructor(public plotter: Plotter, plotOpts = new PCBPlotOptions) {
		this.layerMask = new LSET(PCB_LAYER_ID.F_Cu, PCB_LAYER_ID.B_Cu);
		this.plotOpt   = plotOpts;
		this.layerColors = new Map<number, Color>();
		for ( let i = 0; i < LAYER_COLORS_DIFFING.length; i++) {
			let layerId = <number>LAYER_COLORS_DIFFING[i];
			let color = <Color><any>(LAYER_COLORS_DIFFING[++i]);

			this.layerColors.set(layerId, color)
		}
		console.log("test")
	}

	flashPadCircle(pos: Point, dia: number, fill: Fill, elementMeta?: ElementMeta) {
		if (fill === Fill.FILLED_SHAPE) {
			this.plotter.circle(pos, dia, fill, 0, elementMeta);
		} else {
			let lineWidth = DEFAULT_LINE_WIDTH;
			this.plotter.setCurrentLineWidth(lineWidth);

			if (lineWidth > dia -2) lineWidth = dia - 2;

			this.plotter.circle(pos, dia - lineWidth, Fill.NO_FILL, lineWidth, elementMeta);
		}
	}

	flashPadRect(pos: Point, size: Size, orientation: number, fill: Fill) {
		const points: Array<Point> = [];
		let lineWidth = DEFAULT_LINE_WIDTH;
		if (fill === Fill.FILLED_SHAPE) {
			this.plotter.setCurrentLineWidth(0);
		} else {
			this.plotter.setCurrentLineWidth(lineWidth);
		}

		let width = size.width - lineWidth;
		let height = size.height - lineWidth;
		if (width < 1) width = 1;
		if (height < 1) height = 1;
		const dx = width / 2;
		const dy = height / 2;

		points.push(new Point(pos.x - dx, pos.y + dy));
		points.push(new Point(pos.x - dx, pos.y - dy));
		points.push(new Point(pos.x + dx, pos.y - dy));
		points.push(new Point(pos.x + dx, pos.y + dy));
		for (let point of points) {
			RotatePointWithCenter(point, pos, orientation);
		}

		points.push(points[0]);

		this.plotter.polyline(points, fill, lineWidth);
	}

	flashPadRoundRect(pos: Point, size: Size, cornerRadius: number, orientation: number, fill: Fill) {
		let lineWidth = DEFAULT_LINE_WIDTH;
		if (fill === Fill.FILLED_SHAPE) {
			lineWidth = 0;
		} else {
			size.width -= lineWidth;
			size.height -= lineWidth;
			cornerRadius -= lineWidth / 2;
		}
		const lineTop_left          = new Point(cornerRadius, 0);
		const lineTop_right         = new Point(cornerRadius + size.width - cornerRadius, 0);
		const lineBottom_left       = new Point(cornerRadius, size.height);
		const lineBottom_right      = new Point(cornerRadius + size.width - cornerRadius, size.height);

		const lineLeft_top          = new Point(0, cornerRadius);
		const lineLeft_bottom       = new Point(0, cornerRadius + size.height - cornerRadius);
		const lineRight_top         = new Point(size.width, cornerRadius);
		const lineRight_bottom      = new Point(size.width, cornerRadius + size.height - cornerRadius);

		const arcTopLeft_center     = new Point(cornerRadius, cornerRadius);
		const arcBottomLeft_center  = new Point(cornerRadius, size.height - cornerRadius);
		const arcTopRight_center    = new Point(size.width - cornerRadius, cornerRadius);
		const arcBottomRight_center = new Point(size.width - cornerRadius, size.height - cornerRadius);

		const points = [
			lineTop_left         ,
			lineTop_right        ,
			lineBottom_left      ,
			lineBottom_right     ,
			lineLeft_top         ,
			lineLeft_bottom      ,
			lineRight_top        ,
			lineRight_bottom     ,
			arcTopLeft_center    ,
			arcBottomLeft_center ,
			arcTopRight_center   ,
			arcBottomRight_center
		];

		for (let point of points) {
			RotatePoint(point, orientation);
			const p = Point.add(point, pos);
			point.x = p.x;
			point.y = p.y;
		}

		this.plotter.arc(arcTopLeft_center, orientation + 900, orientation + 1800, cornerRadius, fill, lineWidth);
		this.plotter.arc(arcBottomLeft_center, orientation + 1800, orientation + 2700, cornerRadius, fill, lineWidth);
		this.plotter.arc(arcTopRight_center, orientation + 0, orientation + 900, cornerRadius, fill, lineWidth);
		this.plotter.arc(arcBottomRight_center, orientation + 2700, orientation + 3600, cornerRadius, fill, lineWidth);
		this.plotter.polyline([ lineTop_left, lineTop_right, lineBottom_right, lineBottom_left, lineTop_left ], fill, lineWidth);
		this.plotter.polyline([ lineLeft_top, lineRight_top, lineRight_bottom, lineLeft_bottom, lineLeft_top], fill, lineWidth);
	}

	flashPadTrapezoid(pos: Point, coords: Array<Point>, orientation: number, fill: Fill) {
		let lineWidth = DEFAULT_LINE_WIDTH;
		const corners: Array<Point> = [];

		for (let point of coords) {
			corners.push(Point.from(point));
		}

		if (fill === Fill.FILLED_SHAPE) {
			lineWidth = 0;
		} else {
			corners[0].x += lineWidth;
			corners[0].y -= lineWidth;
			corners[1].x += lineWidth;
			corners[1].y += lineWidth;
			corners[2].x -= lineWidth;
			corners[2].y += lineWidth;
			corners[3].x -= lineWidth;
			corners[3].y -= lineWidth;
		}

		for (var i = 0, len = corners.length; i < len; i++) {
			RotatePoint(corners[i], orientation);
			corners[i] = Point.add(corners[i], pos);
		}

		corners.push(corners[0]);
		this.plotter.polyline(corners, fill, lineWidth);
	}

	flashPadOval(center: Point, size: Size, orientation: number, fill: Fill, elemMeta?:ElementMeta) {
		size = new Size(size.width, size.height);

		if (size.width > size.height) {
			[size.width, size.height] = [size.height, size.width];
			orientation = AddAngles(orientation, 900);
		}

		if (fill === Fill.FILLED_SHAPE) {
			let delta = size.height - size.width;
			let p0 = new Point(
				0,
				-delta / 2
			);
			let p1 = new Point(
				0,
				delta / 2
			);
			RotatePoint( p0, orientation);
			RotatePoint( p1, orientation);

			this.thickSegment(
				Point.add(center, p0),
				Point.add(center, p1),
				size.width,
				fill,
				elemMeta
			);
		} else {
			this.sketchOval( center, size, orientation, DEFAULT_LINE_WIDTH, elemMeta );
		}
	}

	sketchOval(pos: Point, size: Size, orientation: number, lineWidth: number, elemMeta?: ElementMeta) {
		this.plotter.setCurrentLineWidth(lineWidth);
		size = Size.from(size);

		if (size.width > size.height) {
			[size.width, size.height] = [size.height, size.width];
			orientation = AddAngles(orientation, 900);
		}

		const deltaxy = size.height - size.width;
		const radius  = (size.width - lineWidth) / 2;

		let c = new Point();
		c.x = -radius;
		c.y = -deltaxy / 2;
		RotatePoint(c, orientation);
		this.plotter.moveTo(Point.add(c, pos));
		c.x = -radius;
		c.y = deltaxy / 2;
		RotatePoint(c, orientation );
		this.plotter.finishTo(Point.add(c, pos));

		c.x = radius;
		c.y = -deltaxy / 2;
		RotatePoint( c, orientation );
		this.plotter.moveTo(Point.add(c, pos));
		c.x = radius;
		c.y = deltaxy / 2;
		RotatePoint( c, orientation );
		this.plotter.finishTo(Point.add(c, pos));

		c.x = 0;
		c.y = deltaxy / 2;
		RotatePoint( c, orientation );
		this.plotter.arc(
			Point.add(c, pos),
			orientation + 1800, orientation + 3600,
			radius, Fill.NO_FILL, DEFAULT_LINE_WIDTH
		);
		c.x = 0;
		c.y = -deltaxy / 2;
		RotatePoint( c, orientation );
		this.plotter.arc(
			Point.add(c, pos),
			orientation, orientation + 1800,
			radius, Fill.NO_FILL, DEFAULT_LINE_WIDTH,
			elemMeta
		);
	}

	segmentAsOval(start: Point, end: Point, lineWidth: number, fill: Fill, elemMeta? : ElementMeta) {
		const center = new Point(
			(start.x + end.x) / 2,
			(start.y + end.y) / 2
		);
		const size = new Size(
			end.x - start.x,
			end.y - start.y
		);

		let orientation = 0;
		if (size.height === 0) {
			orientation = 0;
		} else
		if (size.width === 0) {
			orientation = 900;
		} else {
			orientation = -ArcTangente( size.height, size.width );
		}

		size.width = EuclideanNorm(size) + lineWidth;
		size.height = lineWidth;

		this.flashPadOval( center, size, orientation, fill, elemMeta);
	}

	thickSegment(start: Point, end: Point, lineWidth: number, fill: Fill, elemMeta?: ElementMeta) {
		if (fill === Fill.FILLED_SHAPE) {
			this.plotter.setFill(Fill.NO_FILL);
			this.plotter.setCurrentLineWidth(lineWidth);
			this.plotter.moveTo(start);
			this.plotter.finishTo(end, elemMeta);
		} else {
			this.plotter.setCurrentLineWidth(DEFAULT_LINE_WIDTH);
			this.segmentAsOval(start, end, lineWidth, fill, elemMeta);
		}
	}

	thickArc(center: Point, startAngle: number, endAngle: number, radius: number, lineWidth: number, fill: Fill, elemMeta?: ElementMeta) {
		if (fill === Fill.FILLED_SHAPE) {
			this.plotter.arc(center, startAngle, endAngle, radius, Fill.NO_FILL, lineWidth, elemMeta);
		} else {
			this.plotter.setCurrentLineWidth(DEFAULT_LINE_WIDTH);
			this.plotter.arc(center, startAngle, endAngle, radius - (lineWidth - DEFAULT_LINE_WIDTH) / 2, Fill.NO_FILL, lineWidth, elemMeta);
			this.plotter.arc(center, startAngle, endAngle, radius + (lineWidth - DEFAULT_LINE_WIDTH) / 2, Fill.NO_FILL, lineWidth, elemMeta);
		}
	}

	thickRect(p1: Point, p2: Point, lineWidth: number, fill: Fill) {
		if (fill === Fill.FILLED_SHAPE) {
			this.plotter.rect(p1, p2, Fill.NO_FILL, lineWidth);
		} else {
			this.plotter.setCurrentLineWidth(DEFAULT_LINE_WIDTH);
			const offsetp1 = new Point(
				p1.x - (lineWidth - DEFAULT_LINE_WIDTH) / 2,
				p1.y - (lineWidth - DEFAULT_LINE_WIDTH) / 2
			);
			const offsetp2 = new Point(
				p2.x + (lineWidth - DEFAULT_LINE_WIDTH) / 2,
				p2.y + (lineWidth - DEFAULT_LINE_WIDTH) / 2
			);
			this.plotter.rect( offsetp1, offsetp2, Fill.NO_FILL, DEFAULT_LINE_WIDTH );
			offsetp1.x += (lineWidth - DEFAULT_LINE_WIDTH);
			offsetp1.y += (lineWidth - DEFAULT_LINE_WIDTH);
			offsetp2.x -= (lineWidth - DEFAULT_LINE_WIDTH);
			offsetp2.y -= (lineWidth - DEFAULT_LINE_WIDTH);
			this.plotter.rect( offsetp1, offsetp2, Fill.NO_FILL, DEFAULT_LINE_WIDTH );
		}
	}

	thickCircle(pos: Point, diameter: number, lineWidth: number, fill: Fill, elemMeta? : ElementMeta) {
		if (fill === Fill.FILLED_SHAPE) {
			this.plotter.circle(pos, diameter, Fill.NO_FILL, lineWidth, elemMeta);
		} else {
			this.plotter.setCurrentLineWidth(DEFAULT_LINE_WIDTH);
			this.plotter.circle( pos, diameter - lineWidth + DEFAULT_LINE_WIDTH, Fill.NO_FILL, DEFAULT_LINE_WIDTH, elemMeta );
			this.plotter.circle( pos, diameter + lineWidth - DEFAULT_LINE_WIDTH, Fill.NO_FILL, DEFAULT_LINE_WIDTH, elemMeta );
		}
	}

	thickCurve(start: Point, end: Point, C1: Point, C2: Point, lineWidth: number, elemMatch?: ElementMeta) {
		lineWidth = lineWidth ? lineWidth : DEFAULT_LINE_WIDTH
		this.plotter.setCurrentLineWidth(lineWidth)
		this.plotter.curve(start, end, C1, C2, lineWidth, elemMatch)
	}

	plotModule(mod: Module) {
		for (let edge of mod.graphics) {
			if (edge instanceof EdgeModule) {
				this.plotEdgeModule(edge, mod);
			}
		}

		for (let pad of mod.pads) {
			if (pad.shape === PadShape.CIRCLE) {
				this.flashPadCircle(pad.pos, pad.size.width, Fill.NO_FILL);
			} else
			if (pad.shape === PadShape.RECT) {
				this.flashPadRect(pad.pos, pad.size, pad.orientation, Fill.NO_FILL);
			} else
			if (pad.shape === PadShape.OVAL) {
				this.flashPadOval(pad.pos, pad.size, pad.orientation, Fill.NO_FILL);
			} else
			if (pad.shape === PadShape.TRAPEZOID) {
			} else
			if (pad.shape === PadShape.ROUNDRECT) {
			}
		}
	}

	plotTextModule(mod: Module, text: TextModule, color: Color) {

		let pos = Point.from(text.pos);
		if (mod) {
			const angle = mod.orientation;
			RotatePoint(pos, angle);
			pos = Point.add(pos, mod.pos);
		}

		const size = text.mirror ? -text.size : text.size;
		let elemMeta = new ElementMeta("module", mod.name, text.layer, "text")

		this.plotter.text(
			pos,
			color,
			text.text,
			text.angle,
			size,
			text.hjustify,
			text.vjustify,
			text.lineWidth,
			text.italic,
			text.bold,
			false,
			elemMeta
		);
	}

	plotAllTextModule(mod: Module) {
		if (this.layerMask.has(mod.reference.layer)) {
			this.plotTextModule(mod, mod.reference, this.getColor(mod.reference.layer));
		}
		if (this.layerMask.has(mod.value.layer)) {
			this.plotTextModule(mod, mod.value, this.getColor(mod.value.layer));
		}
		for (let text of mod.graphics) {
			if (!this.layerMask.has(text.layer)) continue;
			if (text instanceof TextModule) {
				if (!text.visibility) continue;
				this.plotTextModule(mod, text, this.getColor(text.layer));
			}
		}
	}

	plotEdgeModule(edge: EdgeModule, mod: Module) {
		// console.log('plotEdgeModule', edge);
		if((edge.start === undefined) || (edge.end === undefined))
			return
		this.plotter.setColor(this.getColor(edge.layer));

		const lineWidth = edge.lineWidth;
		const shape = edge.shape;
		let pos = Point.from(edge.start);
		let end = Point.from(edge.end);
        let C1 = Point.from({ x: 0, y: 0 })
        let C2 = Point.from({ x: 0, y: 0 })
        if (shape === Shape.CURVE) {
            C1 = Point.from(edge.bezierC1);
            C2 = Point.from(edge.bezierC2);
        }
		if (mod) {
			const angle = mod.orientation;
			RotatePoint(pos, angle);
			RotatePoint(end, angle);
			pos = Point.add(pos, mod.pos);
			end = Point.add(end, mod.pos);
            if (shape === Shape.CURVE) {
                RotatePoint(C1, angle);
                RotatePoint(C2, angle);
                C1 = Point.add(C1, mod.pos);
                C2 = Point.add(C2, mod.pos);
            }
		}

		if (shape === Shape.SEGMENT) {
			this.thickSegment(pos, end, lineWidth, this.getPlotMode(), new ElementMeta("module", mod.name, edge.layer, "segment"));
		} else
		if (shape === Shape.ARC) {
			const radius = GetLineLength(pos, end);
			const startAngle  = ArcTangente( end.y - pos.y, end.x - pos.x );
			const endAngle = startAngle + edge.angle;
			this.thickArc( pos, endAngle, startAngle, radius, lineWidth, this.getPlotMode(), new ElementMeta("module", mod.name, edge.layer, ""));
		} else
		if (shape === Shape.CIRCLE) {
			const radius = GetLineLength(pos, end);
			this.thickCircle(pos, radius * 2, lineWidth, this.getPlotMode(), new ElementMeta("module", mod.name, edge.layer, ""));
		} else
		if (shape === Shape.POLYGON) {
			const points = edge.polyPoints;
			if (points.length <= 1) return;

			const corners: Array<Point> = [];
			for (let point of points) {
				let p = Point.from(point);
				if (mod) {
					RotatePoint(p, mod.orientation);
					p = Point.add(p, mod.pos);
				}
				corners.push(p);
			}
			this.plotter.polyline(corners, Fill.FILLED_SHAPE, lineWidth, new ElementMeta("module", mod.name, edge.layer, ""));
		} else
		if(shape === Shape.CURVE) {
			this.thickCurve(pos, end, C1, C2, edge.lineWidth, new ElementMeta("module", mod.name, edge.layer, ""))
		}else
		if(shape === Shape.LAST){
			console.log()
			// Will implement this later.
		}

		else {
			throw "unexpected shape " + shape;
		}
	}

	plotBoard(board: Board) {
		// console.log('plotBoard', board);
	}

	plotBoardLayer(board: Board, layer: number) {
		this.plotter.setColor(this.getColor(layer));
	}

	plotStandardLayer(board: Board) {
		console.log('plotStandardLayer');

		for (let mod of board.modules) {
			for (let pad of mod.pads) {
				if (!LSET.intersect(this.layerMask, pad.layers).length) continue;

				const margin = new Size(0, 0);
				/*
				const maskOrPaste = new LSET(PCB_LAYER_ID.B_Mask, PCB_LAYER_ID.F_Mask, PCB_LAYER_ID.B_Paste, PCB_LAYER_ID.F_Paste);
				const anded = LSET.intersect(maskOrPaste, this.layerMask);
				if (anded.is(new LSET(PCB_LAYER_ID.F_Mask)) ||anded.is(new LSET(PCB_LAYER_ID.B_Mask))) {
					margin.x = margin.y = pad.getSolderMaskMargin(mod);
				} else
				if (anded.is(new LSET(PCB_LAYER_ID.F_Paste)) ||anded.is(new LSET(PCB_LAYER_ID.B_Paste))) {
					margin = pad.getSolderPasteMargin(mod);
				}
				*/

				let color = Color.BLACK;
				if (pad.layers.has(PCB_LAYER_ID.B_Cu)) {

					if (this.plotOpt.diffing && this.layerColors.get(PCB_LAYER_ID.B_Cu)) {
						color = <Color>this.layerColors.get(PCB_LAYER_ID.B_Cu)
					}
					else
						color = Color.GREEN;

				}
				if (pad.layers.has(PCB_LAYER_ID.F_Cu)) {
					if (this.plotOpt.diffing && this.layerColors.get(PCB_LAYER_ID.F_Cu)) {
						color = <Color>this.layerColors.get(PCB_LAYER_ID.F_Cu)
					}
					else
						color = color.mix(Color.RED);

				}

				this.plotPad(board, pad, color, this.getPlotMode(), new ElementMeta("module", mod.name, mod.layer, "pad" ));
			}
		}

		for (let via of board.vias) {
			if (!this.layerMask.has(via.layer1) && this.layerMask.has(via.layer2)) continue;

			const diameter = via.width + 2;
			if (diameter <= 0) continue;
			this.plotter.setColor(Color.BLACK);
			this.flashPadCircle(via.start, diameter, this.getPlotMode());
		}

		for (let track of board.tracks) {
			if (!this.layerMask.has(track.layer)) continue;
			this.plotter.setColor(this.getColor(track.layer));
			this.thickSegment(track.start, track.end, track.width, this.getPlotMode());
		}

		for (let zone of board.zones) {
			if (!this.layerMask.has(zone.layer)) continue;
			this.plotFilledAreas(board, zone);
		}

		for (let mod of board.modules) {
			// if (!this.layerMask.has(mod.layer)) continue;

			for (let edge of mod.graphics) {
				if (!this.layerMask.has(edge.layer)) continue;

				if (edge instanceof EdgeModule) {
					this.plotEdgeModule(edge, mod);
				}
			}
		}

		this.plotDrillMarks(board);
	}

	plotSilkScreen(board: Board) {
		this.plotBoardGraphicItems(board);

		for (let mod of board.modules) {
			this.plotAllTextModule(mod);
		}
	}

	plotLayerOutline(board: Board) {
	}

	plotSolderMaskLayer(board: Board, minThickness: number) {
	}

	plotBoardLayers(board: Board, layerMask: LSET, color?: Color) {
		this.layerMask = layerMask;
		this.plotStandardLayer(board);
		this.plotSilkScreen(board);
	}

	plotOneBoardLayer(board: Board, layerId: PCB_LAYER_ID) {
		const layerMask = new LSET(layerId);
		this.layerMask = layerMask;

		if (IsCopperLayer(layerId)) {
			this.plotOpt.skipNPTH_Pads = true;
			this.plotStandardLayer(board);
		} else {
			switch (layerId) {
				case PCB_LAYER_ID.B_Mask:
				case PCB_LAYER_ID.F_Mask:
					this.plotOpt.skipNPTH_Pads = false;
					this.plotOpt.drillMarks = DrillMarksType.NO_DRILL_SHAPE;
					if (board.boardDesignSetting.solderMaskMinWidth === 0) {
						this.plotStandardLayer(board);
					} else {
						this.plotSolderMaskLayer(board, board.boardDesignSetting.solderMaskMinWidth);
					}
					break;

				case PCB_LAYER_ID.B_Adhes:
				case PCB_LAYER_ID.F_Adhes:
				case PCB_LAYER_ID.B_Paste:
				case PCB_LAYER_ID.F_Paste:
					this.plotOpt.skipNPTH_Pads = false;
					this.plotOpt.drillMarks = DrillMarksType.NO_DRILL_SHAPE;
					this.plotStandardLayer(board);
					break;

				case PCB_LAYER_ID.F_SilkS:
				case PCB_LAYER_ID.B_SilkS:
					this.plotSilkScreen(board);
					break;
				case PCB_LAYER_ID.Dwgs_User:
				case PCB_LAYER_ID.Cmts_User:
				case PCB_LAYER_ID.Eco1_User:
				case PCB_LAYER_ID.Eco2_User:
				case PCB_LAYER_ID.Edge_Cuts:
				case PCB_LAYER_ID.Margin:
				case PCB_LAYER_ID.F_CrtYd:
				case PCB_LAYER_ID.B_CrtYd:
				case PCB_LAYER_ID.F_Fab:
				case PCB_LAYER_ID.B_Fab:
					this.plotOpt.skipNPTH_Pads = false;
					this.plotOpt.drillMarks = DrillMarksType.NO_DRILL_SHAPE;
					this.plotSilkScreen(board);
					break;
				default:
					this.plotOpt.skipNPTH_Pads = false;
					this.plotOpt.drillMarks = DrillMarksType.NO_DRILL_SHAPE;
					this.plotSilkScreen(board);
					break;
			}
		}
	}

	plotFilledAreas(board: Board, zone: Zone) {
		const polyList = zone.filledPolygons;
		if (!polyList.length) return;

		this.plotter.setColor(this.getColor(zone.layer));

		for (let poly of polyList) {
			const corners: Array<Point> = [];
			for (let point of poly) {
				corners.push(point);
			}
			corners.push(corners[0]);

			if (this.getPlotMode() === Fill.FILLED_SHAPE) {
				if (zone.fillMode === 0) {
					this.plotter.polyline(corners, Fill.FILLED_SHAPE, zone.minThickness);
				} else {
					for (let segs of zone.fillSegments) {
						for (let seg of segs) {
							this.thickSegment(seg.start, seg.end, zone.minThickness, this.getPlotMode());
						}
					}

					if (zone.minThickness > 0) {
						this.plotter.polyline(corners, Fill.NO_FILL, zone.minThickness);
					}
				}
			} else {
				if (zone.minThickness > 0) {
					for (var i = 1, len = corners.length; i < len; i++) {
						this.thickSegment(corners[i-1], corners[i], zone.minThickness, this.getPlotMode());
					}
				}
			}
		}
	}

	plotPad(board: Board, pad: Pad, color: Color, fill: Fill, elementMeta?: ElementMeta) {
		// console.log('plotPad', pad, color, fill);
		this.plotter.setColor(color);
		if (pad.shape === PadShape.CIRCLE) {
			this.flashPadCircle(pad.pos, pad.size.width, fill, elementMeta);
		} else
		if (pad.shape === PadShape.RECT) {
			this.flashPadRect(pad.pos, pad.size, pad.orientation, fill);
		} else
		if (pad.shape === PadShape.OVAL) {
			this.flashPadOval(pad.pos, pad.size, pad.orientation, fill);
		} else
		if (pad.shape === PadShape.TRAPEZOID) {
			const coords: Array<Point> = [];
			let sw = pad.size.width >> 1;
			let sh = pad.size.height >> 1;
			let dw = pad.delta.width >> 1;
			let dh = pad.delta.height >> 1;
			if ( (dw < 0) && (dw <= -sh) ) dw = -sh + 1;
			if ( (dw > 0) && (dw >= sh) ) dw = sh - 1;
			if ( (dh < 0) && (dh <= -sw) ) dh = -sw + 1;
			if ( (dh > 0) && (dh >= sw) ) dh = sw - 1;
			coords.push(new Point(
				-sw - dh,
				+sh + dw
			));
			coords.push(new Point(
				-sw + dh,
				-sh - dw
			));
			coords.push(new Point(
				+sw - dh,
				-sh + dw
			));
			coords.push(new Point(
				+sw + dh,
				+sh - dw
			));
			this.flashPadTrapezoid(pad.pos, coords, pad.orientation, fill);
		} else
		if (pad.shape === PadShape.ROUNDRECT) {
			let r = pad.size.width > pad.size.height ? pad.size.height : pad.size.width;
			r = Math.floor(r * pad.roundRectRatio);
			this.flashPadRoundRect(pad.pos, pad.size, r, pad.orientation, fill);
		}
	}


	plotDrillMarks(board: Board) {
		if (this.getPlotMode() === Fill.FILLED_SHAPE) {
			this.plotter.setColor(Color.BLACK);
		}

		for (let via of board.vias) {
			this.plotOneDrillMark(PadDrillShape.CIRCLE, via.start, new Size(via.drill ? via.drill : 0, 0), new Size(via.width, 0), 0, 0);
		}

		for (let mod of board.modules) {
			for (let pad of mod.pads) {
				if (!pad.drillSize.width) continue;
				this.plotOneDrillMark(pad.drillShape, pad.pos, pad.drillSize, pad.size, pad.orientation, 0);
			}
		}
	}

	plotOneDrillMark(shape: PadDrillShape, pos: Point, drillSize: Size, padSize: Size, orientation: number, smallDrill: number) {
		drillSize = Size.from(drillSize);
		if (smallDrill && shape === PadDrillShape.CIRCLE) {
			drillSize.width = Math.min(smallDrill, drillSize.width);
		}
		drillSize.width  = Clamp(1, drillSize.width, padSize.width - 1);
		drillSize.height = Clamp(1, drillSize.height, padSize.height - 1);
		if (shape === PadDrillShape.OBLONG) {
			this.flashPadOval(pos, drillSize, orientation, this.getPlotMode());
		} else {
			this.flashPadCircle(pos, drillSize.width, this.getPlotMode());
		}
	}

	plotBoardGraphicItems(board: Board) {
		for (let seg of board.drawSegments) {
			this.plotDrawSegment(board, seg);
		}

		for (let dim of board.dimensions) {
			this.plotDimension(board, dim);
		}

		for (let text of board.texts) {
			this.plotBoardText(board, text);
		}

		for (let target of board.targets) {
			// TODO
		}
	}

	plotBoardText(board: Board, text: Text) {
		if (!this.layerMask.has(text.layer)) return;
		const color = this.getColor(text.layer);
		const t = text.text.replace(/\\n/g, "\n");
		this.plotter.text(text.pos, color, t, text.angle, text.size, text.hjustify, text.vjustify, text.lineWidth, text.bold, text.italic);
	}

	plotDrawSegment(board: Board, seg: DrawSegment) {
		const start = Point.from(seg.start);
		const end   = Point.from(seg.end);
		const lineWidth = seg.lineWidth;

		this.plotter.setColor(this.getColor(seg.layer));
		this.plotter.setCurrentLineWidth(lineWidth);

		if (seg.shape === Shape.CIRCLE) {
			const radius = GetLineLength(end, start);
			this.thickCircle(start, radius * 2, lineWidth, this.getPlotMode());
		} else
		if (seg.shape === Shape.ARC) {
			const radius = GetLineLength(end, start);
			const startAngle = ArcTangente(end.y - start.y, end.x - start.x);
			const endAngle   = startAngle + seg.angle;
			this.thickArc(start, endAngle, startAngle, radius, lineWidth, this.getPlotMode());
		} else
		if (seg.shape === Shape.CURVE) {
			for (var i = 1, len = seg.bezierPoints.length; i < len; i++) {
				this.thickSegment(seg.bezierPoints[i-1], seg.bezierPoints[i], lineWidth, this.getPlotMode());
			}
		} else {
			this.thickSegment(start, end, lineWidth, this.getPlotMode());
		}
	}

	plotDimension(board: Board, dim: Dimension) {
		if (!this.layerMask.has(dim.layer)) return;
		const draw = new DrawSegment();

		draw.lineWidth = dim.lineWidth;
		draw.layer = dim.layer;

		this.plotter.setColor(this.getColor(dim.layer));

		console.log(dim.text);
		this.plotBoardText(board, dim.text);

		draw.start = dim.crossBarO;
		draw.end = dim.crossBarF;
		this.plotDrawSegment(board, draw);


		draw.start = dim.featureLineGO;
		draw.end   = dim.featureLineGF;
		this.plotDrawSegment(board, draw);

		draw.start = dim.featureLineDO;
		draw.end = dim.featureLineDF;
		this.plotDrawSegment(board, draw);

		draw.start = dim.crossBarF;
		draw.end =  dim.arrowD1F;
		this.plotDrawSegment(board, draw);

		draw.start = dim.crossBarF;
		draw.end =  dim.arrowD2F;
		this.plotDrawSegment(board, draw);

		draw.start = dim.crossBarO;
		draw.end =  dim.arrowG1F;
		this.plotDrawSegment(board, draw);

		draw.start = dim.crossBarO;
		draw.end =  dim.arrowG2F;
		this.plotDrawSegment(board, draw);
	}

	getColor(layer: number) {
		if(this.plotOpt.diffing) {
			if (this.layerColors.get(layer)) {
				let color = <Color>this.layerColors.get(layer)
				return color
			} else {
				const color = Color.LIGHTGRAY
				return color
			}
		}
		else {
			const color = DEFAULT_LAYER_COLORS[layer] || Color.WHITE;
			if (color.is(Color.WHITE)) {
				return Color.LIGHTGRAY;
			} else {
				return color;
			}
		}
	}

	getPlotMode() {
		return Fill.FILLED_SHAPE;
	}
}

export enum DrillMarksType {
	NO_DRILL_SHAPE    = 0,
	SMALL_DRILL_SHAPE = 1,
	FULL_DRILL_SHAPE  = 2
}

export class PCBPlotOptions {
	drillMarks: DrillMarksType;
	skipNPTH_Pads: boolean;
	diffing: boolean;
	constructor(diffing = false, drillMarks = 1, skipNPTH_Pads = true) {
		this.drillMarks = drillMarks;
		this.skipNPTH_Pads = skipNPTH_Pads;
		this.diffing = diffing
	}
}
