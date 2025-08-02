from marshmallow import EXCLUDE, Schema, fields
from sqlalchemy import or_
from sqlalchemy.orm.query import Query as SQLAlchemyQuery


class PaginationError(Exception):
    """Custom exception for pagination errors."""

    pass


class PaginationSchema(Schema):
    page = fields.Int(load_default=1, description="Page number for pagination")
    per_page = fields.Int(load_default=25, description="Number of items per page")

    order_by = fields.Str(
        load_default="created_at", description="Field to order results by"
    )
    order_direction = fields.Str(
        load_default="desc",
        description="Direction to order results, either 'asc' or 'desc'",
        validate=lambda x: x in ["asc", "desc"],
    )

    class Meta:
        ordered = True
        unknown = EXCLUDE


def paginate_query(
    query: SQLAlchemyQuery,
    url_parameters: dict,
    schema_class: PaginationSchema = PaginationSchema,
):
    """
    Paginate a SQLAlchemy query based on URL parameters.

    :param query: SQLAlchemy query object
    :param url_parameters: Dictionary of URL parameters to apply pagination
    :param schema_class: Schema class to use for pagination
    :return: Paginated query
    """
    schema = schema_class()
    data = schema.load(url_parameters)

    model = query.column_descriptions[0]["entity"]
    column = getattr(model, data["order_by"], None)

    if not column:
        raise PaginationError(f"Invalid order_by field: {data['order_by']}")

    if data["order_direction"] == "asc":
        query = query.order_by(column.asc())
    else:
        query = query.order_by(column.desc())

    return query.offset((data["page"] - 1) * data["per_page"]).limit(data["per_page"])


class SearchSchema(Schema):
    term = fields.Str(load_default=None, allow_none=True)

    class Meta:
        ordered = True
        unknown = EXCLUDE


def search_query(
    query: SQLAlchemyQuery,
    url_parameters: dict,
    search_fields: list,
    schema_class: SearchSchema = SearchSchema,
):
    """
    Search a SQLAlchemy query based on a search term and fields.

    :param query: SQLAlchemy query object
    :param term: Search term to filter results
    :param search_fields: List of fields to search in
    :return: Filtered query
    """
    schema = schema_class()
    data = schema.load(url_parameters)

    term = data.get("term", None)
    if not term:
        return query

    model = query.column_descriptions[0]["entity"]
    filters = [getattr(model, field).ilike(f"%{term}%") for field in search_fields]
    return query.filter(or_(*filters))
