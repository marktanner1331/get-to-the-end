import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ResizeService } from '../services/resize.service';
import { BoardService } from './board.service';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild("board") board?: ElementRef<HTMLElement>;
  @ViewChild("greenCounter") greenCounter?: ElementRef<HTMLElement>;
  @ViewChild("yellowCounter") yellowCounter?: ElementRef<HTMLElement>;

  greenCounterPos = 0;
  yellowCounterPos = 0;

  constructor(boardService: BoardService, private el: ElementRef, private resizeService: ResizeService) {
    boardService.boardComponent = this;
  }

  ngAfterViewInit(): void {
    this.resetCounterPositions();
  }

  ngOnInit() {
    this.resizeService.addResizeEventListener(this.el.nativeElement, () => {
      this.resetCounterPositions();
    });
  }

  ngOnDestroy() {
    this.resizeService.removeResizeEventListener(this.el.nativeElement);
  }

  resetCounterPositions() {
    //the image rect covers the entire image element
    //not the inner image that has been modified via the object-fit:contain css property
    //let's calculate the real image bounds
    let getImageRect = function (board: HTMLElement): DOMRect {
      let imageRect: DOMRect = board.getBoundingClientRect();
      if (imageRect.width > imageRect.height) {
        imageRect = new DOMRect(
          imageRect.x + (imageRect.width - imageRect.height) / 2,
          imageRect.y,
          imageRect.height,
          imageRect.height
        );
      } else {
        imageRect = new DOMRect(
          imageRect.x,
          imageRect.y + (imageRect.height - imageRect.width) / 2,
          imageRect.width,
          imageRect.width
        );
      }

      return imageRect;
    }

    let getTileRect = function (imageRect: DOMRect, counterPos: number) {
      let flipped = 99 - counterPos;
      let row = Math.floor(flipped / 10);

      let column = flipped % 10;
      if((row % 2) == 0) {
        column = 9 - column;
      }

      let x = imageRect.x + column * (imageRect.width / 10);
      let y = imageRect.y + row * (imageRect.height / 10);
      let size = imageRect.width / 10;

      return new DOMRect(x, y, size, size);
    }

    function setElementRect(element: HTMLElement, rect: DOMRect) {
      element.style.left = rect.x + "px";
      element.style.top = rect.y + "px";
      element.style.width = rect.width + "px";
      element.style.height = rect.height + "px";
    }

    let imageRect: DOMRect = getImageRect(this.board!.nativeElement);

    if (this.greenCounterPos != this.yellowCounterPos) {
      let greenTileRect = getTileRect(imageRect, this.greenCounterPos);
      setElementRect(this.greenCounter!.nativeElement, greenTileRect);

      let yellowTileRect = getTileRect(imageRect, this.yellowCounterPos);
      setElementRect(this.yellowCounter!.nativeElement, yellowTileRect);
    } else {
      let tileRect = getTileRect(imageRect, this.greenCounterPos);

      setElementRect(
        this.greenCounter!.nativeElement,
        new DOMRect(tileRect.x, tileRect.y, tileRect.width / 2, tileRect.height / 2));

      setElementRect(
        this.yellowCounter!.nativeElement,
        new DOMRect(tileRect.x + tileRect.width / 2, tileRect.y + tileRect.height / 2, tileRect.width / 2, tileRect.height / 2));
    }
  }
}
