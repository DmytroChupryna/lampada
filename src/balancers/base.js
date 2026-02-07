/**
 * BaseBalancer — standard interface for all video source balancers.
 *
 * Every balancer must implement:
 *   search(object, kpId, data)  — fetch & display video items
 *   extendChoice(saved)         — restore saved filter state
 *   reset()                     — reset filters, re-render
 *   filter(type, a, b)          — apply a filter selection
 *   destroy()                   — cleanup (abort network, etc.)
 */
export function BaseBalancer(component, object) {
    this.component = component;
    this.object    = object;
    this.network   = new Lampa.Reguest();

    this.select_title = object.search || object.search_one || '';
    if (!this.select_title && object.movie) {
        this.select_title = object.movie.title || object.movie.name || '';
    }
}

BaseBalancer.prototype.search = function (/* object, kpId, data */) {
    throw new Error('Balancer must implement search()');
};

BaseBalancer.prototype.extendChoice = function (saved) {
    if (this.choice && saved) {
        Lampa.Arrays.extend(this.choice, saved, true);
    }
};

BaseBalancer.prototype.reset = function () {
    this.component.reset();
    if (this.choice) {
        for (var k in this.choice) this.choice[k] = 0;
    }
};

BaseBalancer.prototype.filter = function (/* type, a, b */) {
    // Override in subclass
};

BaseBalancer.prototype.destroy = function () {
    this.network.clear();
};
